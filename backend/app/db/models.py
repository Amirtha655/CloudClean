import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Float, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:12]


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # Cognito sub
    email: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    accounts: Mapped[list["AwsAccount"]] = relationship(back_populates="user")


class AwsAccount(Base):
    __tablename__ = "aws_accounts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String)
    aws_account_id: Mapped[str] = mapped_column(String)
    role_arn: Mapped[str] = mapped_column(String)
    external_id: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")
    regions: Mapped[list] = mapped_column(JSON, default=list)
    last_scan_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    user: Mapped["User"] = relationship(back_populates="accounts")
    resources: Mapped[list["Resource"]] = relationship(back_populates="account")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    account_id: Mapped[str] = mapped_column(ForeignKey("aws_accounts.id"))
    service: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    arn: Mapped[str] = mapped_column(String)
    region: Mapped[str] = mapped_column(String)
    state: Mapped[str] = mapped_column(String)
    tags: Mapped[dict] = mapped_column(JSON, default=dict)
    monthly_cost: Mapped[float] = mapped_column(Float, default=0)
    last_used_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    owner: Mapped[str] = mapped_column(String, default="unknown")
    environment: Mapped[str] = mapped_column(String, default="dev")
    risk_score: Mapped[str] = mapped_column(String, default="low")
    unused: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    account: Mapped["AwsAccount"] = relationship(back_populates="resources")


class ScanSnapshot(Base):
    """One row per completed scan — the dashboard/cost trend charts are built
    from these, so the trend is always real scan history, never synthesized."""

    __tablename__ = "scan_snapshots"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    account_id: Mapped[str] = mapped_column(ForeignKey("aws_accounts.id"))
    taken_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    total_resources: Mapped[int] = mapped_column(Integer, default=0)
    total_cost: Mapped[float] = mapped_column(Float, default=0)


class DependencyEdge(Base):
    __tablename__ = "dependency_edges"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    source_id: Mapped[str] = mapped_column(ForeignKey("resources.id"))
    target_id: Mapped[str] = mapped_column(ForeignKey("resources.id"))


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id"))
    reason: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    confidence: Mapped[int] = mapped_column(Integer)
    estimated_savings: Mapped[float] = mapped_column(Float, default=0)


class CleanupTemplate(Base):
    __tablename__ = "cleanup_templates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)


class CleanupPlan(Base):
    __tablename__ = "cleanup_plans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    resource_ids: Mapped[list] = mapped_column(JSON, default=list)
    estimated_savings: Mapped[float] = mapped_column(Float, default=0)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=1)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class CleanupHistory(Base):
    __tablename__ = "cleanup_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user: Mapped[str] = mapped_column(String)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, default="completed")
    resources_deleted: Mapped[int] = mapped_column(Integer, default=0)
    resources_failed: Mapped[int] = mapped_column(Integer, default=0)
    savings: Mapped[float] = mapped_column(Float, default=0)
    resource_names: Mapped[list] = mapped_column(JSON, default=list)
