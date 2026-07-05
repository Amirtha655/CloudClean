from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import NotificationSettingsOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/settings", response_model=NotificationSettingsOut)
def get_settings(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    settings = db.query(models.NotificationSetting).first()
    if not settings:
        raise HTTPException(404, "Notification settings not found")
    return settings


@router.put("/settings", response_model=NotificationSettingsOut)
def update_settings(
    payload: NotificationSettingsOut,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    settings = db.query(models.NotificationSetting).first()
    if not settings:
        raise HTTPException(404, "Notification settings not found")
    settings.email = payload.email
    settings.cleanup_started = payload.cleanup_started
    settings.cleanup_completed = payload.cleanup_completed
    settings.cleanup_failed = payload.cleanup_failed
    settings.scheduled_reminder = payload.scheduled_reminder
    db.commit()
    db.refresh(settings)
    return settings
