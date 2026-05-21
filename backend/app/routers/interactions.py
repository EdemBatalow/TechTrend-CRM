from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_active_user, require_roles

router = APIRouter(prefix="/interactions", tags=["interactions"])


@router.get("/", response_model=list[schemas.InteractionRead])
def list_interactions(
    client_id: int | None = None,
    deal_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.InteractionRead]:
    query = db.query(models.Interaction)
    if client_id:
        query = query.filter(models.Interaction.client_id == client_id)
    if deal_id:
        query = query.filter(models.Interaction.deal_id == deal_id)
    
    # Менеджеры видят только свои взаимодействия (или связанные с их сделками)
    if current_user.role == "MANAGER":
        query = query.filter(models.Interaction.user_id == current_user.id)
        
    return query.order_by(models.Interaction.date.desc()).all()


@router.post("/", response_model=schemas.InteractionRead, status_code=status.HTTP_201_CREATED)
def create_interaction(
    interaction_in: schemas.InteractionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.InteractionRead:
    client = db.get(models.Client, interaction_in.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    if interaction_in.deal_id:
        deal = db.get(models.Deal, interaction_in.deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail="Сделка не найдена")

    interaction = models.Interaction(
        type=interaction_in.type,
        date=interaction_in.date,
        description=interaction_in.description,
        duration_minutes=interaction_in.duration_minutes,
        client_id=interaction_in.client_id,
        user_id=current_user.id,
        deal_id=interaction_in.deal_id,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.patch("/{interaction_id}", response_model=schemas.InteractionRead)
def update_interaction(
    interaction_id: int,
    payload: schemas.InteractionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.InteractionRead:
    interaction = db.get(models.Interaction, interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Взаимодействие не найдено")
    
    if current_user.role == "MANAGER" and interaction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(interaction, field, value)
    
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN", "DIRECTOR")),
) -> None:
    interaction = db.get(models.Interaction, interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Взаимодействие не найдено")
    
    db.delete(interaction)
    db.commit()
