from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_active_user, require_roles
from .notify import notify_admins, notify_user


router = APIRouter(prefix="/deals", tags=["deals"])


@router.get("/", response_model=list[schemas.DealRead])
def list_deals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    stage: str | None = Query(default=None),
) -> list[schemas.DealRead]:
    query = db.query(models.Deal)
    if current_user.role == "MANAGER":
        query = query.filter(models.Deal.manager_id == current_user.id)
    if stage:
        query = query.filter(models.Deal.stage == stage)
    return query.order_by(models.Deal.created_at.desc()).all()


@router.post("/", response_model=schemas.DealRead, status_code=status.HTTP_201_CREATED)
def create_deal(
    deal_in: schemas.DealCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER", "ADMIN", "DIRECTOR")),
) -> schemas.DealRead:
    client = db.get(models.Client, deal_in.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    if deal_in.apartment_id:
        apartment = db.get(models.Apartment, deal_in.apartment_id)
        if not apartment:
            raise HTTPException(status_code=404, detail="Квартира не найдена")

    # Если админ/директор создает сделку, он может назначить менеджера.
    # Менеджер всегда создает сделку на себя.
    manager_id = current_user.id
    if current_user.role in {"ADMIN", "DIRECTOR"} and deal_in.manager_id:
        manager_id = deal_in.manager_id

    deal = models.Deal(
        stage=deal_in.stage,
        amount=deal_in.amount,
        client_id=deal_in.client_id,
        manager_id=manager_id,
        apartment_id=deal_in.apartment_id,
        expected_close_date=deal_in.expected_close_date,
        notes=deal_in.notes,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    notify_admins(
        db,
        "Новая сделка",
        f"Создана сделка по клиенту #{deal.client_id}. Менеджер: {manager_id}",
    )
    db.commit()
    return deal


@router.patch("/{deal_id}/stage", response_model=schemas.DealRead)
def update_deal_stage(
    deal_id: int,
    payload: schemas.DealStageUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER")),
) -> schemas.DealRead:
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id, models.Deal.manager_id == current_user.id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    deal.stage = payload.stage
    deal.updated_at = datetime.utcnow()
    db.add(deal)
    db.commit()
    db.refresh(deal)
    notify_admins(
        db,
        "Обновление сделки",
        f"Менеджер {current_user.full_name} изменил этап сделки #{deal.id} на {deal.stage}.",
    )
    db.commit()
    return deal


@router.patch("/{deal_id}", response_model=schemas.DealRead)
def update_deal(
    deal_id: int,
    payload: schemas.DealUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER")),
) -> schemas.DealRead:
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id, models.Deal.manager_id == current_user.id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    if "apartment_id" in payload.dict(exclude_unset=True):
        if payload.apartment_id:
            apartment = db.get(models.Apartment, payload.apartment_id)
            if not apartment:
                raise HTTPException(status_code=404, detail="Квартира не найдена")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(deal, field, value)
    deal.updated_at = datetime.utcnow()
    db.add(deal)
    db.commit()
    db.refresh(deal)
    notify_admins(
        db,
        "Обновление сделки",
        f"Менеджер {current_user.full_name} обновил карточку сделки #{deal.id}.",
    )
    db.commit()
    return deal


@router.patch("/{deal_id}/assign", response_model=schemas.DealRead)
def assign_deal(
    deal_id: int,
    payload: schemas.DealAssign,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
) -> schemas.DealRead:
    deal = db.get(models.Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    manager = db.get(models.User, payload.manager_id)
    if not manager or manager.role != "MANAGER":
        raise HTTPException(status_code=400, detail="Укажите действующего менеджера")

    deal.manager_id = payload.manager_id
    deal.updated_at = datetime.utcnow()
    db.add(deal)
    db.commit()
    db.refresh(deal)

    notify_user(
        db,
        manager.id,
        "Новая делегированная сделка",
        f"Администратор назначил вам сделку #{deal.id}.",
    )
    db.commit()
    return deal


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER", "ADMIN")),
) -> None:
    query = db.query(models.Deal).filter(models.Deal.id == deal_id)
    if current_user.role == "MANAGER":
        query = query.filter(models.Deal.manager_id == current_user.id)
    deal = query.first()
    if not deal:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    db.query(models.Booking).filter(models.Booking.deal_id == deal_id).delete()
    db.delete(deal)
    db.commit()

    if current_user.role == "MANAGER":
        notify_admins(
            db,
            "Удаление сделки",
            f"Менеджер {current_user.full_name} удалил сделку #{deal_id}.",
        )
        db.commit()
