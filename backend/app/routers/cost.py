from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.trends import real_trend
from app.db.base import get_db
from app.db import models
from app.schemas.common import CostAnalyticsOut, ServiceCount, RegionCount, ResourceOut

router = APIRouter(prefix="/cost", tags=["cost"])


@router.get("/analytics", response_model=CostAnalyticsOut)
def analytics(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    resources = (
        db.query(models.Resource)
        .join(models.AwsAccount, models.Resource.account_id == models.AwsAccount.id)
        .filter(models.AwsAccount.user_id == user.id, models.Resource.deleted.is_(False))
        .all()
    )

    by_service: dict[str, list[float]] = defaultdict(list)
    by_region: dict[str, list[float]] = defaultdict(list)
    for r in resources:
        by_service[r.service].append(r.monthly_cost)
        by_region[r.region].append(r.monthly_cost)

    total_cost = sum(r.monthly_cost for r in resources)
    savings = sum(r.monthly_cost for r in resources if r.unused)

    top_expensive = sorted(resources, key=lambda r: -r.monthly_cost)[:8]

    return CostAnalyticsOut(
        current_cost=round(total_cost, 2),
        potential_savings=round(savings, 2),
        by_service=[
            ServiceCount(service=s, count=len(v), cost=round(sum(v), 2)) for s, v in by_service.items()
        ],
        by_region=[
            RegionCount(region=r, count=len(v), cost=round(sum(v), 2)) for r, v in by_region.items()
        ],
        trend=real_trend(db, user),
        top_expensive=[ResourceOut.model_validate(r) for r in top_expensive],
    )
