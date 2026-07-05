import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db import models

random.seed(42)


def now():
    return datetime.now(timezone.utc)


def seed_if_empty(db: Session) -> None:
    """Seeds shared/global demo data only (templates, a sample schedule, sample
    history, default notification settings). AWS accounts and their scanned
    resources are per-user and created through the real connect/scan flow —
    there's no sensible "owner" to seed them under at app startup."""
    if db.query(models.CleanupTemplate).first():
        return

    templates = [
        models.CleanupTemplate(
            name="Development Cleanup",
            description="Remove all non-production resources tagged Environment=development.",
            filters={"environment": "development"},
        ),
        models.CleanupTemplate(
            name="Portfolio Cleanup",
            description="Delete demo/portfolio resources older than 30 days with no traffic.",
            filters={"tag": "portfolio", "lastUsed": "30"},
        ),
        models.CleanupTemplate(
            name="Weekend Cleanup",
            description="Stop/terminate non-critical dev resources before the weekend.",
            filters={"environment": "development,testing"},
        ),
        models.CleanupTemplate(
            name="Everything Except Production",
            description="Delete all resources not tagged Environment=production.",
            filters={"exclude_environment": "production"},
        ),
    ]
    db.add_all(templates)
    db.flush()

    db.add(
        models.ScheduledCleanup(
            name="Friday dev teardown",
            schedule_description="Every Friday at 7:00 PM",
            template_id=templates[2].id,
            next_run_at=now() + timedelta(days=(4 - now().weekday()) % 7, hours=2),
            enabled=True,
        )
    )
    db.add(
        models.ScheduledCleanup(
            name="Stale resource sweep",
            schedule_description="After 30 days of inactivity",
            template_id=templates[1].id,
            next_run_at=now() + timedelta(days=6),
            enabled=True,
        )
    )

    for i in range(6):
        started = now() - timedelta(days=(i + 1) * 5)
        deleted = random.randint(4, 22)
        failed = random.choice([0, 0, 0, 1])
        db.add(
            models.CleanupHistory(
                user="amirtha@cloudclean.io",
                started_at=started,
                finished_at=started + timedelta(minutes=random.randint(1, 6)),
                status="completed" if failed == 0 else "failed",
                resources_deleted=deleted,
                resources_failed=failed,
                savings=round(deleted * random.uniform(3, 9), 2),
            )
        )

    db.add(models.NotificationSetting(email="amirtha@cloudclean.io"))

    db.commit()
