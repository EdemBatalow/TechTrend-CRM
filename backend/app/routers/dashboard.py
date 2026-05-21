from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from .. import models, schemas
from ..database import get_db
from ..security import get_current_active_user


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.DashboardSummary:
    clients_query = db.query(models.Client)
    deals_query = db.query(models.Deal)

    if current_user.role == "MANAGER":
        deals_query = deals_query.filter(models.Deal.manager_id == current_user.id)
        clients_query = clients_query.join(models.Deal, models.Deal.client_id == models.Client.id).filter(
            models.Deal.manager_id == current_user.id
        ).distinct()

    total_clients = clients_query.count()
    active_deals = deals_query.filter(models.Deal.stage != "CLOSED").count()
    closed_deals = deals_query.filter(models.Deal.stage == "CLOSED").count()

    total_apartments = db.query(models.Apartment).count()
    sold_apartments = db.query(models.Apartment).filter(models.Apartment.status == "SOLD").count()
    reserved_apartments = db.query(models.Apartment).filter(models.Apartment.status.in_(["BOOKED", "RESERVED"])) .count()
    available_apartments = db.query(models.Apartment).filter(models.Apartment.status == "AVAILABLE").count()

    revenue = (
        deals_query.filter(models.Deal.stage == "CLOSED")
        .with_entities(func.coalesce(func.sum(models.Deal.amount), 0))
        .scalar()
    )

    return schemas.DashboardSummary(
        total_clients=total_clients,
        active_deals=active_deals,
        closed_deals=closed_deals,
        total_apartments=total_apartments,
        sold_apartments=sold_apartments,
        reserved_apartments=reserved_apartments,
        available_apartments=available_apartments,
        total_revenue=float(revenue or 0),
    )
