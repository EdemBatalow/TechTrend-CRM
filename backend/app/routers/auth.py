from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..security import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_current_admin,
    get_current_user_optional,
    get_effective_subscription,
    get_password_hash,
)


router = APIRouter(prefix="/auth", tags=["auth"])


def _ensure_subscription(db: Session, user: models.User) -> models.Subscription:
    subscription = db.query(models.Subscription).filter(models.Subscription.user_id == user.id).first()
    if subscription:
        return subscription

    subscription = models.Subscription(user_id=user.id, plan="basic", status="inactive", ai_scope="internal")
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user_optional),
) -> schemas.UserRead:
    # Временное снятие ограничения для удобства тестирования проекта
    # user_count = db.query(models.User).count()
    # if user_count > 0:
    #     if not current_user or current_user.role != "ADMIN":
    #         raise HTTPException(
    #             status_code=status.HTTP_403_FORBIDDEN,
    #             detail="Только администратор может регистрировать новых пользователей",
    #         )

    existing = db.query(models.User).filter(models.User.login == user_in.login).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    role = user_in.role.upper()
    if role not in {"ADMIN", "MANAGER"}:
        role = "MANAGER"

    user = models.User(
        login=user_in.login,
        email=user_in.email,
        phone=user_in.phone,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        role=role,
        is_active=True,
        created_by=current_user.login if current_user else "setup",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _ensure_subscription(db, user)
    return user


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> schemas.Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserMe)
def read_users_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.UserMe:
    _ensure_subscription(db, current_user)
    subscription = get_effective_subscription(db, current_user)
    return schemas.UserMe(
        id=current_user.id,
        login=current_user.login,
        email=current_user.email,
        phone=current_user.phone,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_date=current_user.created_date,
        subscription=subscription,
    )


@router.patch("/me", response_model=schemas.UserMe)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.UserMe:
    if payload.login and payload.login != current_user.login:
        existing_login = db.query(models.User).filter(models.User.login == payload.login).first()
        if existing_login:
            raise HTTPException(status_code=400, detail="Логин уже используется")

    if payload.email and payload.email != current_user.email:
        existing_email = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email уже используется")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    subscription = get_effective_subscription(db, current_user)
    return schemas.UserMe(
        id=current_user.id,
        login=current_user.login,
        email=current_user.email,
        phone=current_user.phone,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_date=current_user.created_date,
        subscription=subscription,
    )


@router.get("/users", response_model=list[schemas.UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
    search: str | None = Query(default=None),
) -> list[schemas.UserRead]:
    _ = current_user
    query = db.query(models.User)
    if search:
        query = query.filter(models.User.full_name.ilike(f"%{search}%"))
    return query.order_by(models.User.created_date.desc()).all()


@router.patch("/users/{user_id}/role", response_model=schemas.UserRead)
def update_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
) -> schemas.UserRead:
    _ = current_user
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    user.role = payload.role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
) -> None:
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    db.query(models.Notification).filter(models.Notification.user_id == user.id).delete()
    db.query(models.Subscription).filter(models.Subscription.user_id == user.id).delete()
    db.query(models.Deal).filter(models.Deal.manager_id == user.id).delete()
    db.delete(user)
    db.commit()
