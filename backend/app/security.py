from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models, schemas
from .config import settings
from .database import get_db


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = db.get(models.User, int(user_id))
        return user if user and user.is_active else None
    except JWTError:
        return None


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_user_by_login(db: Session, login: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.login == login).first()


def authenticate_user(db: Session, login: str, password: str) -> Optional[models.User]:
    user = get_user_by_login(db, login)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_effective_subscription(db: Session, user: models.User) -> Optional[models.Subscription]:
    own = db.query(models.Subscription).filter(models.Subscription.user_id == user.id).first()
    if user.role == "ADMIN":
        return own

    admin_active = (
        db.query(models.Subscription)
        .join(models.User, models.User.id == models.Subscription.user_id)
        .filter(models.User.role == "ADMIN", models.Subscription.status == "active")
        .order_by(models.Subscription.last_payment_at.desc().nullslast())
        .first()
    )
    return admin_active or own


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
         raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(user_id=int(user_id))
    except JWTError:
        raise credentials_exception

    user = db.get(models.User, token_data.user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Пользователь деактивирован")
    return current_user


def require_roles(*roles: str) -> Callable:
    allowed = {r.upper() for r in roles}

    async def dependency(
        current_user: models.User = Depends(get_current_active_user),
    ) -> models.User:
        if current_user.role in allowed:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения операции",
        )

    return dependency


def require_subscription(min_plan: str = "basic") -> Callable:
    min_plan = min_plan.lower()

    async def dependency(
        current_user: models.User = Depends(get_current_active_user),
        db: Session = Depends(get_db),
    ) -> models.User:
        subscription = get_effective_subscription(db, current_user)
        if not subscription or subscription.status != "active":
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Требуется активная подписка",
            )

        if min_plan == "pro" and subscription.plan != "pro":
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Для этого AI-модуля нужен тариф Pro",
            )
        return current_user

    return dependency


get_current_admin = require_roles("ADMIN")
