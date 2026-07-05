from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base, engine, SessionLocal
from app.mock.seed import seed_if_empty
from app.routers import (
    auth,
    accounts,
    dashboard,
    resources,
    dependencies,
    recommendations,
    planner,
    history,
    templates,
    scheduled,
    cost,
    reports,
    notifications,
    admin,
)

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_if_empty(db)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(dashboard.router)
app.include_router(resources.router)
app.include_router(dependencies.router)
app.include_router(recommendations.router)
app.include_router(planner.router)
app.include_router(history.router)
app.include_router(templates.router)
app.include_router(scheduled.router)
app.include_router(cost.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
