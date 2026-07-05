from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import AdminStatsOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsOut)
def stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    connected = db.query(models.AwsAccount).filter(models.AwsAccount.status == "connected").count()
    total_scans = db.query(models.AwsAccount).filter(models.AwsAccount.last_scan_at.is_not(None)).count()
    resources_managed = db.query(models.Resource).count()
    savings = db.query(models.CleanupHistory).all()
    active_users = db.query(models.User).count()
    return AdminStatsOut(
        connected_accounts=connected,
        total_scans=total_scans,
        resources_managed=resources_managed,
        savings_generated=round(sum(h.savings for h in savings), 2),
        active_users=active_users,
    )
