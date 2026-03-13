from fastapi import APIRouter, Depends, Query
from typing import Annotated
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Evidence, User
from app.core.auth_helpers import get_investigation_for_user
from app.routers.auth import get_current_user
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
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Отримати резюме розслідування"""
    investigation = get_investigation_for_user(investigation_id, db, current_user)
    
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
    current_user: Annotated[User, Depends(get_current_user)],
    evidence: Annotated[dict, Body(...)],
    db: Annotated[Session, Depends(get_db)],
):
    """Додати доказ до Evidence Vault з хешуванням для ланцюжка довіри"""
    from app.models import Investigation
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if inv:
        get_investigation_for_user(investigation_id, db, current_user)
    if not inv:
        target = evidence.get("target") or evidence.get("query") or evidence.get("source", "unknown")
        inv = Investigation(
            id=investigation_id,
            owner_id=current_user.id,
            title=f"Investigation: {str(target)[:40]}..." if len(str(target)) > 40 else f"Investigation: {target}",
            description="Auto-created from Evidence Vault",
            target_identifier=target,
            status="completed"
        )
        db.add(inv)
        db.commit()

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
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Отримати всі докази для розслідування з перевіркою цілісності"""
    get_investigation_for_user(investigation_id, db, current_user)
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

def _extract_tool_result(evidence: Evidence) -> dict:
    """Витягти результат інструменту з evidence (підтримка обох форматів: frontend wrapper та Celery direct)"""
    try:
        parsed = json.loads(evidence.data) if isinstance(evidence.data, str) else evidence.data
    except Exception:
        return {"raw": str(evidence.data)[:500]}
    # Frontend add_evidence зберігає { source, data, target }
    if isinstance(parsed, dict) and "source" in parsed and "data" in parsed:
        inner = parsed["data"]
        if isinstance(inner, str):
            try:
                return json.loads(inner)
            except Exception:
                return {"raw": inner[:500]}
        return inner
    return parsed


# --- PDF Report Generation (already present, ensure logic is robust) ---
@router.post("/{investigation_id}/generate-report")
async def generate_investigation_report(
    investigation_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    format: Annotated[str, Query()] = "json",
    include_analysis: Annotated[bool, Query()] = True,
):
    """Згенерувати ЗАГАЛЬНИЙ ЗВІТ розслідування"""
    investigation = get_investigation_for_user(investigation_id, db, current_user)
    evidence_list = db.query(Evidence).filter(
        Evidence.investigation_id == investigation_id
    ).all()

    target = investigation.target_identifier or "Невідомий об'єкт"
    tools_used = list(set(e.source for e in evidence_list if e.source))
    findings_parts = []
    if tools_used:
        findings_parts.append(f"Використано інструменти: {', '.join(tools_used)}")
    findings_parts.append(f"Зібрано доказів: {len(evidence_list)}")
    findings = ". ".join(findings_parts) if findings_parts else "OSINT дослідження"

    report = ReportGenerator(investigation_id)
    report.add_executive_summary(
        target=target,
        findings=findings,
        risk_level="UNKNOWN"
    )

    # Групувати докази за типом інструменту (case-insensitive)
    by_source: dict[str, list] = {}
    evidence_data = []
    for evidence in evidence_list:
        tool_result = _extract_tool_result(evidence)
        evidence_data.append(tool_result)
        src_lower = (evidence.source or "unknown").lower()
        if src_lower not in by_source:
            by_source[src_lower] = []
        by_source[src_lower].append(tool_result)

    def _collect_by_pattern(*patterns: str) -> list:
        out = []
        for key in by_source:
            if any(p in key for p in patterns):
                out.extend(by_source[key])
        return out

    # Додати секції за категоріями (без дублікатів)
    osint_results = _collect_by_pattern("maigret", "sherlock", "whatsmyname")
    if osint_results:
        report.add_osint_search_results(target, osint_results)
    net_results = _collect_by_pattern("shodan", "censys", "fofa", "nmap")
    if net_results:
        report.add_network_intelligence(net_results)
    geo_sources = [k for k in by_source if "geospy" in k or "google" in k or "earth" in k or "picarta" in k]
    if geo_sources:
        results = []
        for k in geo_sources:
            results.extend(by_source[k])
        report.add_geolocation_data(results)
    # Секція доказів з хешами
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
