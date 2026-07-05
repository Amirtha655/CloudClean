import boto3

from app.aws.pricing import rds_monthly_cost


def scan_rds_region(session: boto3.Session, region: str) -> list[dict]:
    rds = session.client("rds", region_name=region)
    resources: list[dict] = []

    paginator = rds.get_paginator("describe_db_instances")
    for page in paginator.paginate():
        for db in page.get("DBInstances", []):
            db_id = db["DBInstanceIdentifier"]
            arn = db["DBInstanceArn"]
            tags = {t["Key"]: t["Value"] for t in db.get("TagList", [])}
            resources.append(
                {
                    "key": arn,
                    "service": "RDS",
                    "type": "Database",
                    "name": db_id,
                    "arn": arn,
                    "region": region,
                    "state": db.get("DBInstanceStatus", "unknown"),
                    "tags": tags,
                    "monthly_cost": rds_monthly_cost(db.get("DBInstanceClass", "")),
                    "last_used_days": None,
                    "owner": tags.get("Owner", "unknown"),
                    "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                    "risk_score": "low",
                    "unused": False,
                }
            )

    return resources
