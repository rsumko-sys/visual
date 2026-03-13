"""
OSINT Tool Providers - реальні інтеграції з зовнішніми API.
Якщо провайдер доступний і є API-ключ — використовується реальний запит.
Інакше — fallback на симуляцію.
"""

from app.providers.registry import get_provider, execute_tool

__all__ = ["get_provider", "execute_tool"]
