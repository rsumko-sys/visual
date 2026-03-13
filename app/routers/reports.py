from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import Annotated
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Investigation, Evidence
from app.reporting import (
    ReportGenerator, ReportFormat
)
from fastapi.responses import StreamingResponse
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{investigation_id}/summary")
async def get_investigation_summary(
    investigation_id: str,
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None
):
    """Отримати резюме розслідування"""
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    evidence = db.query(Evidence).filter(
        Evidence.investigation_id == investigation_id
    ).all()
    
    return {
        "investigation": {
            "id": investigation.id,
            "title": investigation.title,
            "target": investigation.target_identifier,
            "status": investigation.status,
            "created_at": investigation.created_at.isoformat()
        },
        "evidence_count": len(evidence),
        "tools_used": list(set(e.source for e in evidence))
    }


# --- Evidence Vault API ---
from fastapi import Body
import hashlib

@router.post("/{investigation_id}/evidence")
async def add_evidence(
    investigation_id: str,
    evidence: Annotated[dict, Body(...)],
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None
):
    """Додати доказ до Evidence Vault з хешуванням для ланцюжка довіри"""
    evidence_hash = hashlib.sha256(json.dumps(evidence, sort_keys=True).encode()).hexdigest()
    new_evidence = Evidence(
        investigation_id=investigation_id,
        data=json.dumps(evidence),
        hash_sha256=evidence_hash,
        source=evidence.get("source", "manual"),
        created_at=datetime.utcnow()
    )
    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)
    return {"status": "ok", "evidence_id": new_evidence.id, "hash": evidence_hash}

@router.get("/{investigation_id}/evidence")
async def get_evidence(
    investigation_id: str,
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None
):
    """Отримати всі докази для розслідування з перевіркою цілісності"""
    evidence_list = db.query(Evidence).filter(Evidence.investigation_id == investigation_id).all()
    result = []
    for ev in evidence_list:
        try:
            data = json.loads(ev.data) if isinstance(ev.data, str) else ev.data
        except:
            data = {"raw": ev.data}
        hash_check = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        result.append({
            "id": ev.id,
            "data": data,
            "hash": ev.hash_sha256,
            "hash_valid": hash_check == ev.hash_sha256,
            "created_at": ev.created_at
        })
    return {"evidence": result, "count": len(result)}

# --- PDF Report Generation (already present, ensure logic is robust) ---
@router.post("/{investigation_id}/generate-report")
async def generate_investigation_report(
    investigation_id: str,
    db: Annotated[Session, Depends(get_db)],
    format: Annotated[str, Query()] = "json",
    include_analysis: Annotated[bool, Query()] = True,
    authorization: Annotated[str | None, Header()] = None
):
    """Згенерувати ЗАГАЛЬНИЙ ЗВІТ розслідування"""
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    evidence_list = db.query(Evidence).filter(
        Evidence.investigation_id == investigation_id
    ).all()
    report = ReportGenerator(investigation_id)
    report.add_executive_summary(
        target=investigation.target_identifier,
        findings=investigation.description or "OSINT дослідження",
        risk_level="UNKNOWN"
    )
    # Додати докази до звіту (з хешуванням)
    evidence_data = []
    for evidence in evidence_list:
        try:
            data = json.loads(evidence.data) if isinstance(evidence.data, str) else evidence.data
        except:
            data = {"raw": evidence.data}
        evidence_data.append(data)
        # Автоматичний розподіл за категоріями в звіті
        if evidence.source in ["maigret", "sherlock"]:
            report.add_osint_search_results(investigation.target_identifier, [data])
        elif evidence.source in ["shodan", "censys"]:
            report.add_network_intelligence([data])
        elif evidence.source in ["geospy", "google_earth"]:
            report.add_geolocation_data([data])
    # Додати секцію доказів з хешами
    if evidence_data:
        report.add_evidence(evidence_data)
    # Генерація виводу
    if format == "pdf":
        pdf_bytes = report.to_pdf()
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{investigation_id}.pdf"}
        )
    elif format == "html":
        return report.generate_html_report()
    elif format == "markdown":
        return report.generate_markdown_report()
    elif format == "csv":
        return report.generate_csv_report()
    return report.report_data
