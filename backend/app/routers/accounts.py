import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.aws.session import get_session
from app.aws.scanner import run_scan
from app.core.security import get_current_user
from app.db.base import get_db, SessionLocal
from app.db import models
from app.schemas.common import AwsAccountOut, AwsAccountCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/accounts", tags=["accounts"])


def _get_owned_account(db: Session, account_id: str, user: models.User) -> models.AwsAccount:
    account = db.get(models.AwsAccount, account_id)
    if not account or account.user_id != user.id:
        raise HTTPException(404, "Account not found")
    return account


def _run_scan_background(account_id: str) -> None:
    db = SessionLocal()
    try:
        account = db.get(models.AwsAccount, account_id)
        if not account:
            return
        try:
            run_scan(db, account)
        except Exception:
            logger.exception("Background scan failed for account %s", account_id)
            account.status = "error"
            db.commit()
    finally:
        db.close()


@router.get("", response_model=list[AwsAccountOut])
def list_accounts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.AwsAccount).filter(models.AwsAccount.user_id == user.id).all()


@router.post("", response_model=AwsAccountOut)
def connect_account(
    payload: AwsAccountCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    account = models.AwsAccount(
        user_id=user.id,
        name=payload.name,
        aws_account_id=payload.aws_account_id,
        role_arn=payload.role_arn,
        external_id=payload.external_id,
        regions=payload.regions,
        status="pending",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.post("/{account_id}/validate", response_model=AwsAccountOut)
def validate_account(
    account_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    account = _get_owned_account(db, account_id, user)
    try:
        session = get_session(account)
        session.client("sts").get_caller_identity()
        account.status = "connected"
    except Exception:
        account.status = "error"
    db.commit()
    db.refresh(account)
    return account


@router.post("/{account_id}/scan", response_model=AwsAccountOut)
def trigger_scan(
    account_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    account = _get_owned_account(db, account_id, user)
    account.status = "scanning"
    db.commit()
    db.refresh(account)
    background_tasks.add_task(_run_scan_background, account_id)
    return account
