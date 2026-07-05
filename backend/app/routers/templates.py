from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.base import get_db
from app.db import models
from app.schemas.common import CleanupTemplateOut

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[CleanupTemplateOut])
def list_templates(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.CleanupTemplate).all()
