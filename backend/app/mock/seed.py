from sqlalchemy.orm import Session

from app.db import models


def seed_if_empty(db: Session) -> None:
    """Seeds the cleanup templates only — the one piece of shared/global data that
    makes sense to have before any real scan happens. AWS accounts, resources,
    and cleanup history are all per-user and created through real use of the app."""
    if db.query(models.CleanupTemplate).first():
        return

    templates = [
        models.CleanupTemplate(
            name="Development Cleanup",
            description="Show all resources tagged Environment=development.",
            filters={"environment": "development"},
        ),
        models.CleanupTemplate(
            name="Unused Resources",
            description="Show resources flagged unused — stopped, idle, empty, or unattached.",
            filters={"unused": "true"},
        ),
        models.CleanupTemplate(
            name="Weekend Cleanup",
            description="Show non-critical development resources to stop before the weekend.",
            filters={"environment": "development"},
        ),
        models.CleanupTemplate(
            name="Everything Except Production",
            description="Show all resources not tagged Environment=production.",
            filters={"excludeEnvironment": "production"},
        ),
    ]
    db.add_all(templates)
    db.commit()
