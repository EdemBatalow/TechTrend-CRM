from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_active_user, require_roles
from .notify import notify_admins


router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("/", response_model=list[schemas.ClientRead])
def list_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    search: str | None = Query(default=None),
) -> list[schemas.ClientRead]:
    _ = current_user
    query = db.query(models.Client)
    if search:
        query = query.filter(models.Client.full_name.ilike(f"%{search}%"))
    return query.order_by(models.Client.created_at.desc()).all()


@router.post("/", response_model=schemas.ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    client_in: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER")),
) -> schemas.ClientRead:
    client = models.Client(
        full_name=client_in.full_name,
        phone=client_in.phone,
        email=client_in.email,
        source=client_in.source,
        notes=client_in.notes,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    notify_admins(
        db,
        "Новый клиент",
        f"Менеджер {current_user.full_name} добавил клиента {client.full_name}.",
    )
    db.commit()
    return client


@router.patch("/{client_id}", response_model=schemas.ClientRead)
def update_client(
    client_id: int,
    payload: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER")),
) -> schemas.ClientRead:
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(client, field, value)
    db.add(client)
    db.commit()
    db.refresh(client)
    notify_admins(
        db,
        "Обновление клиента",
        f"Менеджер {current_user.full_name} обновил данные клиента {client.full_name}.",
    )
    db.commit()
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER")),
) -> None:
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")

    db.query(models.Deal).filter(models.Deal.client_id == client_id).delete()
    db.query(models.Booking).filter(models.Booking.client_id == client_id).delete()
    db.delete(client)
    db.commit()
    notify_admins(
        db,
        "Удаление клиента",
        f"Менеджер {current_user.full_name} удалил клиента {client.full_name}.",
    )
    db.commit()
