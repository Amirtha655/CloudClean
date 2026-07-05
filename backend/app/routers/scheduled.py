from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import ScheduledCleanupOut

router = APIRouter(prefix="/scheduled", tags=["scheduled"])


@router.get("", response_model=list[ScheduledCleanupOut])
def list_scheduled(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.ScheduledCleanup).all()


@router.post("/{schedule_id}/toggle", response_model=ScheduledCleanupOut)
def toggle_scheduled(
    schedule_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    sched = db.get(models.ScheduledCleanup, schedule_id)
    if not sched:
        raise HTTPException(404, "Schedule not found")
    sched.enabled = not sched.enabled
    db.commit()
    db.refresh(sched)
    return sched
