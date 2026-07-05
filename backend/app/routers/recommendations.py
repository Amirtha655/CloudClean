from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import RecommendationOut

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationOut])
def list_recommendations(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Recommendation, models.Resource)
        .join(models.Resource, models.Recommendation.resource_id == models.Resource.id)
        .join(models.AwsAccount, models.Resource.account_id == models.AwsAccount.id)
        .filter(models.AwsAccount.user_id == user.id, models.Resource.deleted.is_(False))
        .order_by(models.Recommendation.confidence.desc())
        .all()
    )
    return [
        RecommendationOut(
            id=rec.id,
            resource_id=rec.resource_id,
            resource_name=res.name,
            service=res.service,
            reason=rec.reason,
            action=rec.action,
            confidence=rec.confidence,
            estimated_savings=rec.estimated_savings,
        )
        for rec, res in rows
    ]
