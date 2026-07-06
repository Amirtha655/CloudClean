from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import ResourceOut

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=list[ResourceOut])
def list_resources(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    region: str | None = None,
    service: str | None = None,
    environment: str | None = None,
    state: str | None = None,
    owner: str | None = None,
    risk: str | None = None,
    unused: bool | None = None,
    excludeEnvironment: str | None = None,
    search: str | None = Query(default=None, description="Match against name, ARN, or resource ID"),
):
    q = (
        db.query(models.Resource)
        .join(models.AwsAccount, models.Resource.account_id == models.AwsAccount.id)
        .filter(models.AwsAccount.user_id == user.id, models.Resource.deleted.is_(False))
    )
    if region:
        q = q.filter(models.Resource.region == region)
    if service:
        q = q.filter(models.Resource.service == service)
    if environment:
        q = q.filter(models.Resource.environment == environment)
    if state:
        q = q.filter(models.Resource.state == state)
    if owner:
        q = q.filter(models.Resource.owner == owner)
    if risk:
        q = q.filter(models.Resource.risk_score == risk)
    if unused is not None:
        q = q.filter(models.Resource.unused == unused)
    if excludeEnvironment:
        q = q.filter(models.Resource.environment != excludeEnvironment)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (models.Resource.name.ilike(like))
            | (models.Resource.arn.ilike(like))
            | (models.Resource.id.ilike(like))
        )
    return q.order_by(models.Resource.monthly_cost.desc()).all()
