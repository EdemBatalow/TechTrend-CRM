import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_active_user, get_effective_subscription, require_roles, require_subscription
from ..services.ai_assistant import (
    build_external_fallback_insight,
    build_internal_snapshot,
    generate_internal_insight,
)
from ..services.external_sources import load_external_snapshot


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=schemas.AnalyticsOverview)
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: models.User = Depends(require_subscription("basic")),
) -> schemas.AnalyticsOverview:
    deals_query = db.query(models.Deal)
    if current_user.role == "MANAGER":
        deals_query = deals_query.filter(models.Deal.manager_id == current_user.id)

    total_deals = deals_query.count()
    closed_deals = deals_query.filter(models.Deal.stage == "CLOSED").count()
    conversion_rate = round((closed_deals / total_deals) * 100, 2) if total_deals else 0.0

    return schemas.AnalyticsOverview(
        conversion_rate=conversion_rate,
        avg_sale_cycle_days=21,
        project_rating=4.6,
        repeat_contacts=64.0,
    )


@router.get("/report", response_model=schemas.AnalyticsReport)
def analytics_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "DIRECTOR")),
    _: models.User = Depends(require_subscription("basic")),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
) -> schemas.AnalyticsReport:
    _ = current_user
    deals_query = db.query(models.Deal)

    if date_from:
        deals_query = deals_query.filter(func.date(models.Deal.created_at) >= date_from)
    if date_to:
        deals_query = deals_query.filter(func.date(models.Deal.created_at) <= date_to)

    deals_total = deals_query.count()
    deals_closed = deals_query.filter(models.Deal.stage == "CLOSED").count()
    revenue = (
        deals_query.filter(models.Deal.stage == "CLOSED")
        .with_entities(func.coalesce(func.sum(models.Deal.amount), 0))
        .scalar()
    )

    deals_subquery = deals_query.with_entities(models.Deal.id, models.Deal.manager_id).subquery()
    top_manager_row = (
        db.query(models.User.full_name, func.count(deals_subquery.c.id).label("cnt"))
        .join(deals_subquery, deals_subquery.c.manager_id == models.User.id)
        .group_by(models.User.full_name)
        .order_by(func.count(deals_subquery.c.id).desc())
        .first()
    )

    return schemas.AnalyticsReport(
        report_period=f"{date_from or 'начало'} - {date_to or 'сегодня'}",
        deals_total=deals_total,
        deals_closed=deals_closed,
        conversion_rate=round((deals_closed / deals_total) * 100, 2) if deals_total else 0.0,
        revenue_total=float(revenue or 0),
        top_manager=top_manager_row[0] if top_manager_row else None,
    )


def _build_internal_payload(
    db: Session,
    current_user: models.User,
    date_from,
    date_to,
) -> tuple[str, dict]:
    snapshot = build_internal_snapshot(
        db,
        current_user,
        date_from=date_from,
        date_to=date_to,
    )
    insight = generate_internal_insight(snapshot)
    return insight["summary"], snapshot


def _build_external_payload() -> tuple[str, dict]:
    snapshot = load_external_snapshot()
    insight = build_external_fallback_insight(snapshot)
    payload = {
        "avito_avg_price": snapshot.avito_avg_price,
        "domclick_avg_price": snapshot.domclick_avg_price,
        "cian_avg_price": snapshot.cian_avg_price,
        "cbr_key_rate": snapshot.cbr_key_rate,
    }
    return insight["summary"], payload


@router.post("/runs", response_model=schemas.AnalyticsRunRead)
def create_analytics_run(
    payload: schemas.AnalyticsRunCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: models.User = Depends(require_subscription("basic")),
) -> schemas.AnalyticsRunRead:
    if payload.scope == "external":
        subscription = get_effective_subscription(db, current_user)
        if not subscription or subscription.status != "active" or subscription.plan != "pro":
            raise HTTPException(status_code=402, detail="Для внешней аналитики нужен тариф Pro")

    if payload.scope == "external":
        try:
            summary, data = _build_external_payload()
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=f"Внешние источники не настроены: {exc}") from exc
    else:
        summary, data = _build_internal_payload(db, current_user, payload.date_from, payload.date_to)

    run = models.AnalysisRun(
        user_id=current_user.id,
        scope=payload.scope,
        date_from=payload.date_from,
        date_to=payload.date_to,
        summary=summary,
        payload=json.dumps(data, ensure_ascii=False),
        notes=payload.notes,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.get("/runs", response_model=list[schemas.AnalyticsRunRead])
def list_analytics_runs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: models.User = Depends(require_subscription("basic")),
    scope: str | None = Query(default=None),
) -> list[schemas.AnalyticsRunRead]:
    query = db.query(models.AnalysisRun).filter(models.AnalysisRun.user_id == current_user.id)
    if scope:
        query = query.filter(models.AnalysisRun.scope == scope)
    return query.order_by(models.AnalysisRun.created_at.desc()).all()


@router.patch("/runs/{run_id}", response_model=schemas.AnalyticsRunRead)
def update_analytics_run(
    run_id: int,
    payload: schemas.AnalyticsRunUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: models.User = Depends(require_subscription("basic")),
) -> schemas.AnalyticsRunRead:
    run = (
        db.query(models.AnalysisRun)
        .filter(models.AnalysisRun.id == run_id, models.AnalysisRun.user_id == current_user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Запись анализа не найдена")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(run, field, value)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.delete("/runs/{run_id}", status_code=204)
def delete_analytics_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: models.User = Depends(require_subscription("basic")),
) -> None:
    run = (
        db.query(models.AnalysisRun)
        .filter(models.AnalysisRun.id == run_id, models.AnalysisRun.user_id == current_user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Запись анализа не найдена")

    db.delete(run)
    db.commit()
