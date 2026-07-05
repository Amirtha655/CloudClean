from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.aws import cognito
from app.db.base import get_db
from app.db import models


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> models.User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()

    claims = cognito.get_user(token)

    user = db.get(models.User, claims["sub"])
    if not user:
        user = models.User(id=claims["sub"], email=claims["email"], name=claims["name"])
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.email != claims["email"] or user.name != claims["name"]:
        user.email = claims["email"]
        user.name = claims["name"]
        db.commit()

    return user
