from datetime import datetime, timedelta, timezone

import boto3
from botocore.exceptions import ClientError

from app.aws.pricing import LAMBDA_ESTIMATED_MONTHLY


def _invocations_last_30d(cw: boto3.client, function_name: str) -> int:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)
    try:
        resp = cw.get_metric_statistics(
            Namespace="AWS/Lambda",
            MetricName="Invocations",
            Dimensions=[{"Name": "FunctionName", "Value": function_name}],
            StartTime=start,
            EndTime=end,
            Period=2592000,  # whole 30-day window as a single bucket
            Statistics=["Sum"],
        )
        datapoints = resp.get("Datapoints", [])
        return int(sum(dp["Sum"] for dp in datapoints))
    except ClientError:
        return -1  # unknown — don't claim "unused" without a real signal


def scan_lambda_region(session: boto3.Session, region: str) -> list[dict]:
    lam = session.client("lambda", region_name=region)
    cw = session.client("cloudwatch", region_name=region)
    resources: list[dict] = []

    paginator = lam.get_paginator("list_functions")
    for page in paginator.paginate():
        for fn in page.get("Functions", []):
            name = fn["FunctionName"]
            arn = fn["FunctionArn"]
            try:
                tags = lam.list_tags(Resource=arn).get("Tags", {})
            except ClientError:
                tags = {}

            invocations = _invocations_last_30d(cw, name)
            unused = invocations == 0

            resources.append(
                {
                    "key": arn,
                    "service": "Lambda",
                    "type": "Function",
                    "name": name,
                    "arn": arn,
                    "region": region,
                    "state": fn.get("State", "Active"),
                    "tags": tags,
                    "monthly_cost": LAMBDA_ESTIMATED_MONTHLY,
                    "last_used_days": 30 if unused else None,
                    "owner": tags.get("Owner", "unknown"),
                    "environment": tags.get("Environment", tags.get("Env", "unspecified")),
                    "risk_score": "low",
                    "unused": unused,
                }
            )

    return resources
