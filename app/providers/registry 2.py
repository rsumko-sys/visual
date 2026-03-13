"""
Реєстр OSINT-провайдерів. Додає нові провайдери для реальної інтеграції.
"""

import logging
from typing import Optional, Dict, Any

from app.providers.shodan_provider import ShodanProvider
from app.providers.maigret_provider import MaigretProvider

logger = logging.getLogger(__name__)

_PROVIDERS: Dict[str, Any] = {
    "shodan": ShodanProvider(),
    "shodan_iot": ShodanProvider(),  # той самий API
    "maigret": MaigretProvider(),
    "maigret_v3": MaigretProvider(),  # alias для каталогу
}


def get_provider(tool_id: str):
    """Повертає провайдер для tool_id або None."""
    return _PROVIDERS.get(tool_id)


def execute_tool(tool_id: str, query: str, api_key: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Виконує інструмент через реальний провайдер.
    Повертає результат або None (якщо провайдер недоступний/немає ключа).
    """
    provider = get_provider(tool_id)
    if not provider:
        return None
    opts = options or {}
    try:
        return provider.run(query, api_key, opts)
    except Exception as e:
        logger.warning(f"Provider {tool_id} failed: {e}")
        return None
