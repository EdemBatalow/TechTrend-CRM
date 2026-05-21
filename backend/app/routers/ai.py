from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_effective_subscription, require_subscription
from ..services.ai_assistant import (
    build_internal_snapshot,
    generate_chat_reply,
    generate_external_insight,
    generate_internal_insight,
)
from ..services.external_sources import load_external_snapshot


router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/internal", response_model=schemas.AIEnvironmentInsight)
def internal_environment_analysis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription("basic")),
) -> schemas.AIEnvironmentInsight:
    snapshot = build_internal_snapshot(db, current_user)
    insight = generate_internal_insight(snapshot)
    return schemas.AIEnvironmentInsight(
        module="internal",
        summary=insight["summary"],
        factors=insight["factors"],
        recommendations=insight["recommendations"],
    )


@router.get("/external", response_model=schemas.AIEnvironmentInsight)
def external_environment_analysis(
    current_user: models.User = Depends(require_subscription("pro")),  # noqa: ARG001
) -> schemas.AIEnvironmentInsight:
    try:
        snapshot = load_external_snapshot()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=f"Внешние источники не настроены: {exc}") from exc

    insight = generate_external_insight(snapshot)
    return schemas.AIEnvironmentInsight(
        module="external",
        summary=insight["summary"],
        factors=insight["factors"],
        recommendations=insight["recommendations"],
    )


@router.get("/demand", response_model=schemas.AIDemandForecast)
def demand_forecast(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription("basic")),  # noqa: ARG001
) -> schemas.AIDemandForecast:
    today = date.today()
    start_date = today - timedelta(days=6)

    rows = (
        db.query(func.date(models.Booking.start_date), func.count(models.Booking.id))
        .filter(func.date(models.Booking.start_date) >= start_date)
        .group_by(func.date(models.Booking.start_date))
        .all()
    )
    counts_by_date = {d: int(cnt) for d, cnt in rows}

    weekday_labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    points: list[schemas.AISeriesPoint] = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        points.append(
            schemas.AISeriesPoint(
                label=weekday_labels[day.weekday()],
                value=float(counts_by_date.get(day, 0)),
            )
        )

    return schemas.AIDemandForecast(title="Спрос по бронированиям за 7 дней", points=points)


@router.post("/chat", response_model=schemas.AIChatResponse)
def ai_chat(
    payload: schemas.AIChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription("basic")),
) -> schemas.AIChatResponse:
    snapshot = build_internal_snapshot(db, current_user)

    external_snapshot = None
    subscription = get_effective_subscription(db, current_user)
    if subscription and subscription.status == "active" and subscription.plan == "pro":
        try:
            external_snapshot = load_external_snapshot()
        except RuntimeError:
            external_snapshot = None

    result = generate_chat_reply(
        snapshot,
        [message.model_dump() for message in payload.messages],
        external_snapshot=external_snapshot,
    )
    return schemas.AIChatResponse(reply=result["reply"], suggestions=result["suggestions"])
