import random
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import DashboardSummary, ServiceCount, RegionCount, TrendPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

RISK_WEIGHT = {"low": 1, "medium": 4, "high": 9}


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
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
    unused_savings = sum(r.monthly_cost for r in resources if r.unused)
    risk_total = sum(RISK_WEIGHT[r.risk_score] for r in resources)
    risk_score = min(100, round(risk_total / max(len(resources), 1) * 10))

    rec_count = (
        db.query(models.Recommendation)
        .join(models.Resource, models.Recommendation.resource_id == models.Resource.id)
        .join(models.AwsAccount, models.Resource.account_id == models.AwsAccount.id)
        .filter(models.AwsAccount.user_id == user.id)
        .count()
    )

    trend = []
    base = max(len(resources) - 12, 5)
    now = datetime.now(timezone.utc)
    for i in range(14, 0, -1):
        trend.append(
            TrendPoint(
                date=(now - timedelta(days=i)).strftime("%Y-%m-%d"),
                resources=base + random.randint(-2, 2) + (14 - i) // 2,
                cost=round(total_cost * (0.75 + (14 - i) * 0.015), 2),
            )
        )

    return DashboardSummary(
        total_resources=len(resources),
        monthly_cost=round(total_cost, 2),
        potential_savings=round(unused_savings, 2),
        risk_score=risk_score,
        by_service=[
            ServiceCount(service=s, count=len(v), cost=round(sum(v), 2))
            for s, v in sorted(by_service.items(), key=lambda kv: -sum(kv[1]))
        ],
        by_region=[
            RegionCount(region=r, count=len(v), cost=round(sum(v), 2))
            for r, v in sorted(by_region.items(), key=lambda kv: -sum(kv[1]))
        ],
        growth_trend=trend,
        recommendation_count=rec_count,
    )
