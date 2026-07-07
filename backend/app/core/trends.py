from collections import defaultdict

from sqlalchemy.orm import Session

from app.db import models
from app.schemas.common import TrendPoint


def real_trend(db: Session, user: models.User) -> list[TrendPoint]:
    """Trend series built purely from recorded scan snapshots. One point per
    calendar day: the latest snapshot that day for each account, summed across
    the user's accounts. Empty until the user has actually scanned."""
    snapshots = (
        db.query(models.ScanSnapshot)
        .join(models.AwsAccount, models.ScanSnapshot.account_id == models.AwsAccount.id)
        .filter(models.AwsAccount.user_id == user.id)
        .order_by(models.ScanSnapshot.taken_at)
        .all()
    )

    latest_per_day_account: dict[tuple[str, str], models.ScanSnapshot] = {}
    for s in snapshots:
        latest_per_day_account[(s.taken_at.strftime("%Y-%m-%d"), s.account_id)] = s

    by_day: dict[str, list[models.ScanSnapshot]] = defaultdict(list)
    for (day, _account_id), s in latest_per_day_account.items():
        by_day[day].append(s)

    return [
        TrendPoint(
            date=day,
            resources=sum(s.total_resources for s in day_snaps),
            cost=round(sum(s.total_cost for s in day_snaps), 2),
        )
        for day, day_snaps in sorted(by_day.items())
    ]
