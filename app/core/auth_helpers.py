"""Auth helpers for reports/vault — require JWT and ownership check."""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Investigation, User
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

SYSTEM_USER_ID = "system"


def get_investigation_for_user(
    investigation_id: str,
    db: Session,
    current_user: User,
) -> Investigation:
    """
    Fetch investigation and verify ownership.
    - If owner_id == current_user.id -> allow
    - If owner_id == system -> allow (legacy/system-created)
    - Else -> 403 Forbidden
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if inv.owner_id != current_user.id and inv.owner_id != SYSTEM_USER_ID:
        raise HTTPException(status_code=403, detail="Access denied")
    return inv
