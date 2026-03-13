from celery import Celery
from app.config import settings
from app.database import SessionLocal
from app.models import Evidence
from app.providers import execute_tool
import logging
import time
import json
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)

celery_app = Celery(
    "osint",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

def calculate_hash(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()


def _mock_result(tool_id: str, query: str) -> dict:
    """Fallback-результат для інструментів без реальної інтеграції."""
    time.sleep(1)
    return {
        "found": True,
        "indicators": [f"indicator_{tool_id}_01", f"indicator_{tool_id}_02"],
        "raw_log": f"Simulated: analyzed {query} using {tool_id} (no API integration yet).",
    }


@celery_app.task(name="run_osint_tool")
def run_osint_tool(tool_id: str, query: str, investigation_id: str = None, api_key: str = None, options: dict = None):
    """Глобальна задача для запуску будь-якого OSINT інструменту (Золотий стандарт 2026)"""
    opts = options or {}
    logger.info(f"Task started: Running {tool_id} for query: {query} options={opts}")

    # Спроба реальної інтеграції
    data_result = execute_tool(tool_id, query or "", api_key, opts)

    # Fallback на симуляцію, якщо провайдер недоступний
    if data_result is None:
        data_result = _mock_result(tool_id, query or "(empty)")
    
    results = {
        "tool": tool_id,
        "query": query,
        "status": "completed",
        "timestamp": datetime.utcnow().isoformat(),
        "data": data_result
    }
    
    # Автоматичне збереження в Evidence Vault, якщо вказано investigation_id
    if investigation_id:
        db = SessionLocal()
        try:
            data_str = json.dumps(data_result)
            evidence = Evidence(
                investigation_id=investigation_id,
                source=tool_id,
                data=data_str,
                hash_sha256=calculate_hash(data_str),
                created_at=datetime.utcnow()
            )
            db.add(evidence)
            db.commit()
            logger.info(f"Evidence saved to vault for investigation {investigation_id}")
        except Exception as e:
            logger.error(f"Failed to save evidence: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    return results

@celery_app.task(name="test_task")
def test_task(query: str):
    logger.info(f"Processing test task with query: {query}")
    return {"result": f"Processed: {query}"}
