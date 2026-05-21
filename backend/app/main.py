from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import ai, analytics, apartments, auth, billing, clients, dashboard, deals, notifications, interactions


Base.metadata.create_all(bind=engine)

app = FastAPI(title="TechTrend CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notifications.router)
app.include_router(billing.router)
app.include_router(clients.router)
app.include_router(deals.router)
app.include_router(apartments.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(interactions.router)


@app.get("/", tags=["health"])
def healthcheck():
    return {"status": "ok", "service": "techtrend-crm"}
