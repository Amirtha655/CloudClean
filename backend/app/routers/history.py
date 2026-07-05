from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import CleanupHistoryOut

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[CleanupHistoryOut])
def list_history(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.CleanupHistory)
        .order_by(models.CleanupHistory.started_at.desc())
        .all()
    )
