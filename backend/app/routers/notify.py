from sqlalchemy.orm import Session

from .. import models


def notify_admins(db: Session, title: str, message: str) -> None:
    admins = db.query(models.User).filter(models.User.role == "ADMIN").all()
    for admin in admins:
        db.add(
            models.Notification(
                user_id=admin.id,
                title=title,
                message=message,
                is_read=False,
            )
        )


def notify_user(db: Session, user_id: int, title: str, message: str) -> None:
    db.add(
        models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            is_read=False,
        )
    )
