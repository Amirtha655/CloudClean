import boto3
from botocore.exceptions import ClientError

from app.aws.pricing import s3_monthly_cost


def scan_s3(session: boto3.Session) -> list[dict]:
    """S3 is a global service — one call covers every bucket regardless of region."""
    s3 = session.client("s3")
    resources: list[dict] = []

    for bucket in s3.list_buckets().get("Buckets", []):
        name = bucket["Name"]
        try:
            location = s3.get_bucket_location(Bucket=name).get("LocationConstraint")
            region = location or "us-east-1"
        except ClientError:
            region = "us-east-1"

        try:
            # Single page only — good enough to detect "empty" and roughly size small
            # buckets without paginating potentially millions of objects.
            listing = s3.list_objects_v2(Bucket=name, MaxKeys=1000)
            objects = listing.get("Contents", [])
            approx_size = sum(o.get("Size", 0) for o in objects)
            is_empty = listing.get("KeyCount", 0) == 0
        except ClientError:
            objects, approx_size, is_empty = [], 0, False

        try:
            tags_resp = s3.get_bucket_tagging(Bucket=name)
            tags = {t["Key"]: t["Value"] for t in tags_resp.get("TagSet", [])}
        except ClientError:
            tags = {}

        resources.append(
            {
                "key": name,
                "service": "S3",
                "type": "Bucket",
                "name": name,
                "arn": f"arn:aws:s3:::{name}",
                "region": region,
                "state": "empty" if is_empty else "active",
                "tags": tags,
                "monthly_cost": s3_monthly_cost(approx_size),
                "last_used_days": None,
                "owner": tags.get("Owner", "unknown"),
                "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                "risk_score": "low",
                "unused": is_empty,
            }
        )

    return resources
