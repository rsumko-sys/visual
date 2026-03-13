"""Helpers for optional auth on reports/vault — system-owned investigations stay public."""
from fastapi import Header, HTTPException
from sqlalchemy.orm import Session
from app.models import Investigation, User
from app.routers.auth import get_current_user
from jose import jwt, JWTError
from app.config import settings
from typing import Optional

SYSTEM_USER_ID = "system"


def get_investigation_with_auth(
    investigation_id: str,
    db: Session,
    authorization: Optional[str] = Header(None),
) -> Investigation:
    """
    Fetch investigation. If owner is system — allow without auth.
    If owner is real user — require valid JWT and ownership.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if inv.owner_id == SYSTEM_USER_ID:
        return inv

    # Real user owns it — require auth
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = parts[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id != inv.owner_id:
            raise HTTPException(status_code=403, detail="Access denied")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return inv
