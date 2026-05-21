from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_active_user, require_roles
from .notify import notify_admins


router = APIRouter(prefix="/apartments", tags=["apartments"])


@router.get("/", response_model=list[schemas.ApartmentRead])
def list_apartments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.ApartmentRead]:
    _ = current_user
    return db.query(models.Apartment).order_by(models.Apartment.id.desc()).all()


@router.post("/", response_model=schemas.ApartmentRead, status_code=status.HTTP_201_CREATED)
def create_apartment(
    apartment_in: schemas.ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
) -> schemas.ApartmentRead:
    _ = current_user
    apartment = models.Apartment(
        number=apartment_in.number,
        district=apartment_in.district,
        floor=apartment_in.floor,
        area=apartment_in.area,
        rooms=apartment_in.rooms,
        price=apartment_in.price,
        status=apartment_in.status,
        section_id=apartment_in.section_id,
    )
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    return apartment


@router.patch("/{apartment_id}/status", response_model=schemas.ApartmentRead)
def update_apartment_status(
    apartment_id: int,
    payload: schemas.ApartmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("MANAGER", "ADMIN")),
) -> schemas.ApartmentRead:
    apartment = db.get(models.Apartment, apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Квартира не найдена")

    apartment.status = payload.status
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    if current_user.role == "MANAGER":
        notify_admins(
            db,
            "Обновление статуса квартиры",
            f"Менеджер {current_user.full_name} изменил статус квартиры №{apartment.number} на {apartment.status}.",
        )
        db.commit()
    return apartment


@router.patch("/{apartment_id}", response_model=schemas.ApartmentRead)
def update_apartment(
    apartment_id: int,
    payload: schemas.ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
) -> schemas.ApartmentRead:
    apartment = db.get(models.Apartment, apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Квартира не найдена")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(apartment, field, value)
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    return apartment


@router.delete("/{apartment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
) -> None:
    apartment = db.get(models.Apartment, apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Квартира не найдена")

    db.query(models.Booking).filter(models.Booking.apartment_id == apartment_id).delete()
    db.delete(apartment)
    db.commit()
