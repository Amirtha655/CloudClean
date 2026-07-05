import re
from datetime import datetime, timezone

import boto3

from app.aws.pricing import ec2_monthly_cost, ebs_monthly_cost, ELASTIC_IP_UNATTACHED_MONTHLY

STATE_REASON_TS = re.compile(r"\((\d{4}-\d{2}-\d{2}) ")


def _tags_to_dict(tags: list | None) -> dict[str, str]:
    return {t["Key"]: t["Value"] for t in (tags or [])}


def _stopped_days(state_transition_reason: str | None) -> int | None:
    if not state_transition_reason:
        return None
    m = STATE_REASON_TS.search(state_transition_reason)
    if not m:
        return None
    stopped_at = datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return max((datetime.now(timezone.utc) - stopped_at).days, 0)


def scan_ec2_region(session: boto3.Session, region: str) -> tuple[list[dict], list[tuple[str, str]]]:
    """Returns (resources, edges) for EC2 instances, their EBS volumes, Elastic IPs,
    and security groups in one region — all four are scanned together so real
    attachment data can become dependency edges."""
    ec2 = session.client("ec2", region_name=region)
    resources: list[dict] = []
    edges: list[tuple[str, str]] = []

    reservations = ec2.describe_instances().get("Reservations", [])
    instances = [i for r in reservations for i in r.get("Instances", [])]

    for inst in instances:
        iid = inst["InstanceId"]
        tags = _tags_to_dict(inst.get("Tags"))
        state = inst["State"]["Name"]
        stopped_days = _stopped_days(inst.get("StateTransitionReason")) if state == "stopped" else None
        resources.append(
            {
                "key": iid,
                "service": "EC2",
                "type": "Instance",
                "name": tags.get("Name", iid),
                "arn": f"arn:aws:ec2:{region}:{inst.get('OwnerId', '')}:instance/{iid}",
                "region": region,
                "state": state,
                "tags": tags,
                "monthly_cost": ec2_monthly_cost(inst.get("InstanceType", "")),
                "last_used_days": stopped_days,
                "owner": tags.get("Owner", "unknown"),
                "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                "risk_score": "low",
                "unused": state == "stopped",
            }
        )
        for bdm in inst.get("BlockDeviceMappings", []):
            vol_id = bdm.get("Ebs", {}).get("VolumeId")
            if vol_id:
                edges.append((iid, vol_id))
        for sg in inst.get("SecurityGroups", []):
            edges.append((iid, sg["GroupId"]))

    volumes = ec2.describe_volumes().get("Volumes", [])
    for vol in volumes:
        vid = vol["VolumeId"]
        tags = _tags_to_dict(vol.get("Tags"))
        attached = bool(vol.get("Attachments"))
        resources.append(
            {
                "key": vid,
                "service": "EBS",
                "type": "Volume",
                "name": tags.get("Name", vid),
                "arn": f"arn:aws:ec2:{region}::volume/{vid}",
                "region": region,
                "state": vol["State"],
                "tags": tags,
                "monthly_cost": ebs_monthly_cost(vol.get("Size", 0)),
                "last_used_days": None,
                "owner": tags.get("Owner", "unknown"),
                "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                "risk_score": "low",
                "unused": not attached,
            }
        )

    addresses = ec2.describe_addresses().get("Addresses", [])
    for addr in addresses:
        aid = addr.get("AllocationId", addr.get("PublicIp"))
        tags = _tags_to_dict(addr.get("Tags"))
        attached = bool(addr.get("InstanceId") or addr.get("AssociationId"))
        resources.append(
            {
                "key": aid,
                "service": "ElasticIP",
                "type": "Address",
                "name": tags.get("Name", addr.get("PublicIp", aid)),
                "arn": f"arn:aws:ec2:{region}::eip/{aid}",
                "region": region,
                "state": "attached" if attached else "unattached",
                "tags": tags,
                "monthly_cost": 0.0 if attached else ELASTIC_IP_UNATTACHED_MONTHLY,
                "last_used_days": None,
                "owner": tags.get("Owner", "unknown"),
                "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                "risk_score": "low",
                "unused": not attached,
            }
        )
        if addr.get("InstanceId"):
            edges.append((addr["InstanceId"], aid))

    groups = ec2.describe_security_groups().get("SecurityGroups", [])
    for sg in groups:
        gid = sg["GroupId"]
        tags = _tags_to_dict(sg.get("Tags"))
        resources.append(
            {
                "key": gid,
                "service": "SecurityGroup",
                "type": "Group",
                "name": sg.get("GroupName", gid),
                "arn": f"arn:aws:ec2:{region}:{sg.get('OwnerId', '')}:security-group/{gid}",
                "region": region,
                "state": "active",
                "tags": tags,
                "monthly_cost": 0.0,
                "last_used_days": None,
                "owner": tags.get("Owner", "unknown"),
                "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                "risk_score": "low",
                "unused": False,
            }
        )

    return resources, edges
