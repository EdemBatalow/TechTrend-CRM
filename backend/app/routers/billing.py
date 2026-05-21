from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_effective_subscription, require_roles


router = APIRouter(prefix="/billing", tags=["billing"])

PLANS = {
    "basic": {
        "title": "Базовый",
        "price": 750.0,
        "period_days": 30,
        "ai_scope": "internal",
        "features": [
            "AI-модуль внутренней среды",
            "Базовая CRM-аналитика",
            "Работа с клиентами и сделками",
        ],
    },
    "pro": {
        "title": "Pro",
        "price": 1500.0,
        "period_days": 30,
        "ai_scope": "external",
        "features": [
            "AI внутренней и внешней среды",
            "Расширенная аналитика и отчёты",
            "Приоритетная поддержка",
        ],
    },
}


def ensure_user_subscription(db: Session, user_id: int) -> models.Subscription:
    subscription = db.query(models.Subscription).filter(models.Subscription.user_id == user_id).first()
    if subscription:
        return subscription

    subscription = models.Subscription(
        user_id=user_id,
        plan="basic",
        status="inactive",
        ai_scope="internal",
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("/plans", response_model=list[schemas.SubscriptionPlanRead])
def get_plans() -> list[schemas.SubscriptionPlanRead]:
    return [
        schemas.SubscriptionPlanRead(
            code=code,
            title=data["title"],
            price=data["price"],
            period_days=data["period_days"],
            ai_scope=data["ai_scope"],
            features=data["features"],
        )
        for code, data in PLANS.items()
    ]


@router.get("/me", response_model=schemas.SubscriptionRead)
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "MANAGER", "DIRECTOR", "AGENT")),
) -> schemas.SubscriptionRead:
    ensure_user_subscription(db, current_user.id)
    effective = get_effective_subscription(db, current_user)
    if not effective:
        raise HTTPException(status_code=404, detail="Подписка не найдена")
    return effective


@router.post("/checkout", response_model=schemas.SubscriptionCheckoutResponse)
def checkout_subscription(
    payload: schemas.SubscriptionCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
) -> schemas.SubscriptionCheckoutResponse:
    plan_info = PLANS.get(payload.plan)
    if not plan_info:
        raise HTTPException(status_code=400, detail="Неизвестный тариф")

    now = datetime.now(timezone.utc)

    admin_sub = ensure_user_subscription(db, current_user.id)
    admin_sub.plan = payload.plan
    admin_sub.status = "active"
    admin_sub.ai_scope = plan_info["ai_scope"]
    admin_sub.started_at = now
    admin_sub.last_payment_at = now
    admin_sub.renewal_at = now + timedelta(days=plan_info["period_days"])
    admin_sub.amount = plan_info["price"]
    admin_sub.last_modified_date = now
    db.add(admin_sub)

    other_users = db.query(models.User).filter(models.User.id != current_user.id).all()
    for user in other_users:
        sub = ensure_user_subscription(db, user.id)
        sub.plan = payload.plan
        sub.status = "active"
        sub.ai_scope = plan_info["ai_scope"]
        sub.started_at = now
        sub.last_payment_at = now
        sub.renewal_at = now + timedelta(days=plan_info["period_days"])
        sub.amount = 0
        sub.last_modified_date = now
        db.add(sub)

        if user.role in {"MANAGER", "DIRECTOR", "AGENT"}:
            db.add(
                models.Notification(
                    user_id=user.id,
                    title="Подписка активирована",
                    message=f"Администратор активировал тариф {plan_info['title']}. Доступ к AI-модулю обновлен.",
                    is_read=False,
                )
            )

    db.commit()
    db.refresh(admin_sub)

    return schemas.SubscriptionCheckoutResponse(
        payment_url=f"https://pay.techtrend.local/checkout?user={current_user.id}&plan={payload.plan}",
        message=f"Тариф {plan_info['title']} успешно активирован",
        subscription=admin_sub,
    )
