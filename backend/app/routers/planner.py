from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import (
    CleanupPlanCreate,
    CleanupPlanOut,
    ServiceCount,
    CleanupWarning,
    CleanupHistoryOut,
)

router = APIRouter(prefix="/planner", tags=["planner"])


def _owned_resources(db: Session, user: models.User, resource_ids: list[str]):
    return (
        db.query(models.Resource)
        .join(models.AwsAccount, models.Resource.account_id == models.AwsAccount.id)
        .filter(
            models.Resource.id.in_(resource_ids),
            models.AwsAccount.user_id == user.id,
        )
        .all()
    )


def _build_warnings(db: Session, resource_ids: list[str]) -> list[CleanupWarning]:
    warnings: list[CleanupWarning] = []
    selected = set(resource_ids)
    edges = (
        db.query(models.DependencyEdge)
        .filter(
            or_(
                models.DependencyEdge.source_id.in_(resource_ids),
                models.DependencyEdge.target_id.in_(resource_ids),
            )
        )
        .all()
    )
    resource_map = {r.id: r for r in db.query(models.Resource).filter(models.Resource.id.in_(selected)).all()}
    for e in edges:
        # A resource being deleted is depended on by something NOT in the selection
        if e.target_id in selected and e.source_id not in selected:
            source = db.get(models.Resource, e.source_id)
            target = resource_map.get(e.target_id)
            if source and target:
                warnings.append(
                    CleanupWarning(
                        resource_name=target.name,
                        message=f"{target.name} is used by {source.name}",
                        risk="high",
                    )
                )
    return warnings


@router.post("/plan", response_model=CleanupPlanOut)
def create_plan(
    payload: CleanupPlanCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    resources = [
        r for r in _owned_resources(db, user, payload.resource_ids) if not r.deleted
    ]
    if not resources:
        raise HTTPException(400, "No valid resources selected")

    by_service: dict[str, list[float]] = defaultdict(list)
    for r in resources:
        by_service[r.service].append(r.monthly_cost)

    plan = models.CleanupPlan(
        resource_ids=[r.id for r in resources],
        estimated_savings=round(sum(r.monthly_cost for r in resources), 2),
        estimated_duration_minutes=max(1, round(len(resources) * 0.15)),
        warnings=[w.model_dump(by_alias=True) for w in _build_warnings(db, [r.id for r in resources])],
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return CleanupPlanOut(
        id=plan.id,
        resource_ids=plan.resource_ids,
        resource_count_by_service=[
            ServiceCount(service=s, count=len(v), cost=round(sum(v), 2)) for s, v in by_service.items()
        ],
        total_count=len(resources),
        estimated_savings=plan.estimated_savings,
        estimated_duration_minutes=plan.estimated_duration_minutes,
        warnings=[CleanupWarning(**w) for w in plan.warnings],
        created_at=plan.created_at,
    )


@router.get("/plan/{plan_id}", response_model=CleanupPlanOut)
def get_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    plan = db.get(models.CleanupPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    resources = _owned_resources(db, user, plan.resource_ids)
    by_service: dict[str, list[float]] = defaultdict(list)
    for r in resources:
        by_service[r.service].append(r.monthly_cost)
    return CleanupPlanOut(
        id=plan.id,
        resource_ids=plan.resource_ids,
        resource_count_by_service=[
            ServiceCount(service=s, count=len(v), cost=round(sum(v), 2)) for s, v in by_service.items()
        ],
        total_count=len(resources),
        estimated_savings=plan.estimated_savings,
        estimated_duration_minutes=plan.estimated_duration_minutes,
        warnings=[CleanupWarning(**w) for w in plan.warnings],
        created_at=plan.created_at,
    )


@router.post("/plan/{plan_id}/execute", response_model=CleanupHistoryOut)
def execute_plan(
    plan_id: str,
    dry_run: bool = True,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    plan = db.get(models.CleanupPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")

    resources = _owned_resources(db, user, plan.resource_ids)
    names = [r.name for r in resources]

    if dry_run:
        return CleanupHistoryOut(
            id="dry-run",
            user=user.email,
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
            status="completed",
            resources_deleted=0,
            resources_failed=0,
            savings=0,
        )

    for r in resources:
        r.deleted = True

    history = models.CleanupHistory(
        user=user.email,
        finished_at=datetime.now(timezone.utc),
        status="completed",
        resources_deleted=len(resources),
        resources_failed=0,
        savings=plan.estimated_savings,
        resource_names=names,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history
