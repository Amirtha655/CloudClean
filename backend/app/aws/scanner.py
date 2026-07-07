import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.aws.session import get_session
from app.aws.scanners.ec2 import scan_ec2_region
from app.aws.scanners.s3 import scan_s3
from app.aws.scanners.lambda_ import scan_lambda_region
from app.aws.scanners.rds import scan_rds_region
from app.db import models

logger = logging.getLogger(__name__)


def _recommendation_for(res: dict) -> dict | None:
    if not res["unused"]:
        return None
    if res["service"] == "EC2":
        days = res["last_used_days"]
        reason = f"Stopped for {days} days" if days is not None else "Stopped"
        confidence = min(60 + (days or 20), 98)
        return {"reason": reason, "action": "Terminate", "confidence": confidence}
    if res["service"] == "S3":
        return {"reason": "Bucket empty", "action": "Delete", "confidence": 90}
    if res["service"] == "Lambda":
        return {"reason": "Not invoked in 30+ days", "action": "Delete", "confidence": 92}
    if res["service"] == "ElasticIP":
        return {"reason": "Unattached", "action": "Release", "confidence": 95}
    if res["service"] == "EBS":
        return {"reason": "Available, not attached", "action": "Delete", "confidence": 88}
    return None


def run_scan(db: Session, account: models.AwsAccount) -> models.AwsAccount:
    session = get_session(account)

    all_resources: list[dict] = []
    all_edges: list[tuple[str, str]] = []

    for region in account.regions:
        try:
            ec2_resources, ec2_edges = scan_ec2_region(session, region)
            all_resources += ec2_resources
            all_edges += ec2_edges
        except Exception:
            logger.exception("EC2 scan failed for %s", region)

        try:
            all_resources += scan_lambda_region(session, region)
        except Exception:
            logger.exception("Lambda scan failed for %s", region)

        try:
            all_resources += scan_rds_region(session, region)
        except Exception:
            logger.exception("RDS scan failed for %s", region)

    try:
        all_resources += scan_s3(session)
    except Exception:
        logger.exception("S3 scan failed")

    # Replace this account's prior scan snapshot entirely.
    old_resource_ids = [r.id for r in db.query(models.Resource.id).filter(models.Resource.account_id == account.id)]
    if old_resource_ids:
        db.query(models.DependencyEdge).filter(
            models.DependencyEdge.source_id.in_(old_resource_ids) | models.DependencyEdge.target_id.in_(old_resource_ids)
        ).delete(synchronize_session=False)
        db.query(models.Recommendation).filter(models.Recommendation.resource_id.in_(old_resource_ids)).delete(
            synchronize_session=False
        )
        db.query(models.Resource).filter(models.Resource.account_id == account.id).delete(synchronize_session=False)

    key_to_id: dict[str, str] = {}
    new_rows = []
    for res in all_resources:
        row = models.Resource(
            account_id=account.id,
            service=res["service"],
            type=res["type"],
            name=res["name"],
            arn=res["arn"],
            region=res["region"],
            state=res["state"],
            tags=res["tags"],
            monthly_cost=res["monthly_cost"],
            last_used_days=res["last_used_days"],
            owner=res["owner"],
            environment=res["environment"],
            risk_score=res["risk_score"],
            unused=res["unused"],
        )
        db.add(row)
        db.flush()
        key_to_id[res["key"]] = row.id
        new_rows.append((row, res))

    dependents_count: dict[str, int] = {}
    for source_key, target_key in all_edges:
        source_id = key_to_id.get(source_key)
        target_id = key_to_id.get(target_key)
        if source_id and target_id:
            db.add(models.DependencyEdge(source_id=source_id, target_id=target_id))
            dependents_count[target_id] = dependents_count.get(target_id, 0) + 1

    for row, _res in new_rows:
        deps = dependents_count.get(row.id, 0)
        if deps >= 2:
            row.risk_score = "high"
        elif deps == 1:
            row.risk_score = "medium"

    for row, res in new_rows:
        rec = _recommendation_for(res)
        if rec:
            db.add(
                models.Recommendation(
                    resource_id=row.id,
                    reason=rec["reason"],
                    action=rec["action"],
                    confidence=rec["confidence"],
                    estimated_savings=row.monthly_cost,
                )
            )

    db.add(
        models.ScanSnapshot(
            account_id=account.id,
            total_resources=len(new_rows),
            total_cost=round(sum(row.monthly_cost for row, _res in new_rows), 2),
        )
    )

    account.last_scan_at = datetime.now(timezone.utc)
    account.status = "connected"
    db.commit()
    db.refresh(account)
    return account
