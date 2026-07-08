"""Real, irreversible deletion of AWS resources, in dependency-safe order.

Only ever invoked for resources a user explicitly selected and confirmed in the
cleanup planner. Each resource is attempted independently; one failure never
aborts the rest. Returns (deleted, failed) where failed carries a reason string.
"""

import logging
import time
from collections import defaultdict

import boto3
from botocore.exceptions import ClientError

from app.db import models

logger = logging.getLogger(__name__)


def _native_id(resource: models.Resource) -> str:
    """The real AWS identifier, parsed from the ARN the scanner stored.

    EC2 instance/volume/eip/sg ARNs end in '.../<id>'; S3, Lambda and RDS ARNs
    end in ':<name>'.
    """
    arn = resource.arn
    if "/" in arn:
        return arn.rsplit("/", 1)[-1]
    return arn.rsplit(":", 1)[-1]


def _empty_bucket(s3, bucket: str) -> None:
    """Delete every object and version so the bucket can be removed."""
    paginator = s3.get_paginator("list_object_versions")
    for page in paginator.paginate(Bucket=bucket):
        objects = [{"Key": o["Key"], "VersionId": o["VersionId"]} for o in page.get("Versions", [])]
        objects += [{"Key": o["Key"], "VersionId": o["VersionId"]} for o in page.get("DeleteMarkers", [])]
        if objects:
            s3.delete_objects(Bucket=bucket, Delete={"Objects": objects})


def delete_resources(session: boto3.Session, resources: list[models.Resource]):
    """Delete the given resources. Returns (deleted, failed) lists; `failed`
    entries are (resource, reason) tuples."""
    by_service: dict[str, list[models.Resource]] = defaultdict(list)
    for r in resources:
        by_service[r.service].append(r)

    deleted: list[models.Resource] = []
    failed: list[tuple[models.Resource, str]] = []

    # 1. Release Elastic IPs first (frees them from instances about to die).
    for r in by_service.get("ElasticIP", []):
        try:
            session.client("ec2", region_name=r.region).release_address(AllocationId=_native_id(r))
            deleted.append(r)
        except ClientError as e:
            if "InvalidAllocationID.NotFound" in str(e):
                deleted.append(r)
            else:
                failed.append((r, str(e)))

    # 2. Terminate EC2 instances, then wait so dependent volumes/SGs can go.
    ec2_by_region: dict[str, list[models.Resource]] = defaultdict(list)
    for r in by_service.get("EC2", []):
        ec2_by_region[r.region].append(r)
    for region, rows in ec2_by_region.items():
        ec2 = session.client("ec2", region_name=region)
        ids = [_native_id(r) for r in rows]
        try:
            ec2.terminate_instances(InstanceIds=ids)
            deleted.extend(rows)
        except ClientError as e:
            for r in rows:
                failed.append((r, str(e)))
            continue
        try:
            ec2.get_waiter("instance_terminated").wait(
                InstanceIds=ids, WaiterConfig={"Delay": 10, "MaxAttempts": 30}
            )
        except Exception:
            logger.warning("Timed out waiting for %s to terminate in %s", ids, region)

    # 3. Delete EBS volumes (retry briefly if a just-terminated instance is still detaching).
    for r in by_service.get("EBS", []):
        ec2 = session.client("ec2", region_name=r.region)
        vid = _native_id(r)
        for attempt in range(4):
            try:
                ec2.delete_volume(VolumeId=vid)
                deleted.append(r)
                break
            except ClientError as e:
                msg = str(e)
                if "InvalidVolume.NotFound" in msg:
                    deleted.append(r)  # already gone (e.g. delete-on-termination)
                    break
                if "VolumeInUse" in msg and attempt < 3:
                    time.sleep(15)
                    continue
                failed.append((r, msg))
                break

    # 4. Delete security groups (default SGs and in-use SGs will fail; that's expected).
    for r in by_service.get("SecurityGroup", []):
        try:
            session.client("ec2", region_name=r.region).delete_security_group(GroupId=_native_id(r))
            deleted.append(r)
        except ClientError as e:
            failed.append((r, str(e)))

    # 5. Lambda functions.
    for r in by_service.get("Lambda", []):
        try:
            session.client("lambda", region_name=r.region).delete_function(FunctionName=_native_id(r))
            deleted.append(r)
        except ClientError as e:
            failed.append((r, str(e)))

    # 6. S3 buckets (empty first).
    for r in by_service.get("S3", []):
        s3 = session.client("s3", region_name=r.region)
        bucket = _native_id(r)
        try:
            _empty_bucket(s3, bucket)
            s3.delete_bucket(Bucket=bucket)
            deleted.append(r)
        except ClientError as e:
            if "NoSuchBucket" in str(e):
                deleted.append(r)
            else:
                failed.append((r, str(e)))

    # 7. RDS instances (async on AWS side; the call returning is success enough).
    for r in by_service.get("RDS", []):
        try:
            session.client("rds", region_name=r.region).delete_db_instance(
                DBInstanceIdentifier=_native_id(r),
                SkipFinalSnapshot=True,
                DeleteAutomatedBackups=True,
            )
            deleted.append(r)
        except ClientError as e:
            if "DBInstanceNotFound" in str(e):
                deleted.append(r)
            else:
                failed.append((r, str(e)))

    return deleted, failed
