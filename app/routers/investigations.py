from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated
from app.database import get_db
from app.models import Investigation, User
from app.schemas import InvestigationCreate, InvestigationResponse
from app.routers.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=InvestigationResponse)
async def create_investigation(
    inv: InvestigationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    new_investigation = Investigation(
        owner_id=current_user.id,
        title=inv.title,
        description=inv.description,
        target_identifier=inv.target_identifier,
        status="pending"
    )
    db.add(new_investigation)
    db.commit()
    db.refresh(new_investigation)
    
    logger.info(f"Investigation {new_investigation.id} created by {current_user.username}")
    return new_investigation

@router.get("/", response_model=list[InvestigationResponse])
async def list_investigations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    investigations = db.query(Investigation).filter(Investigation.owner_id == current_user.id).all()
    return investigations

@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(
    investigation_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.owner_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation
