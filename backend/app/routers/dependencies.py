from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import DependencyGraphOut, DependencyNode, DependencyEdgeOut

router = APIRouter(prefix="/dependencies", tags=["dependencies"])

RISK_RANK = {"low": 0, "medium": 1, "high": 2}


@router.get("/{resource_id}", response_model=DependencyGraphOut)
def get_dependency_graph(
    resource_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    root = (
        db.query(models.Resource)
        .join(models.AwsAccount, models.Resource.account_id == models.AwsAccount.id)
        .filter(models.Resource.id == resource_id, models.AwsAccount.user_id == user.id)
        .first()
    )
    if not root:
        raise HTTPException(404, "Resource not found")

    edges = (
        db.query(models.DependencyEdge)
        .filter(
            or_(
                models.DependencyEdge.source_id == resource_id,
                models.DependencyEdge.target_id == resource_id,
            )
        )
        .all()
    )

    node_ids = {resource_id}
    for e in edges:
        node_ids.add(e.source_id)
        node_ids.add(e.target_id)

    nodes = db.query(models.Resource).filter(models.Resource.id.in_(node_ids)).all()
    affected = [n.name for n in nodes if n.id != resource_id]
    risk = "low"
    if affected:
        risk = max((n.risk_score for n in nodes if n.id != resource_id), key=lambda r: RISK_RANK[r], default="low")
        if len(affected) >= 3:
            risk = "high"

    return DependencyGraphOut(
        resource_id=resource_id,
        nodes=[DependencyNode(id=n.id, label=n.name, service=n.service) for n in nodes],
        edges=[DependencyEdgeOut(source=e.source_id, target=e.target_id) for e in edges],
        risk=risk,
        affected=affected,
    )
