"""
Shodan API Provider - реальна інтеграція з Shodan.
"""

import logging
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class ShodanProvider:
    """Провайдер для Shodan та Shodan IoT Monitor."""

    def run(self, query: str, api_key: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Виконує пошук у Shodan.
        query: IP-адреса для host lookup або search query (наприклад "apache", "port:22").
        options: limit (5-100) для search.
        """
        key = api_key or (settings.SHODAN_KEY if settings.SHODAN_KEY else None)
        if not key:
            logger.debug("Shodan: no API key configured")
            return None

        opts = options or {}
        limit = min(100, max(5, int(opts.get("limit", 10))))

        try:
            import shodan
            api = shodan.Shodan(key)

            # Якщо query виглядає як IP — host lookup (не споживає кредити)
            query_stripped = query.strip()
            if self._looks_like_ip(query_stripped):
                host = api.host(query_stripped)
                return self._format_host_result(host)
            else:
                # Search (споживає 1 кредит на 100 результатів)
                results = api.search(query_stripped, limit=limit)
                return self._format_search_result(results, query_stripped, limit)
        except Exception as e:
            logger.error(f"Shodan API error: {e}")
            raise

    def _looks_like_ip(self, s: str) -> bool:
        """Перевірка чи рядок схожий на IP-адресу."""
        parts = s.split(".")
        if len(parts) != 4:
            return False
        try:
            return all(0 <= int(p) <= 255 for p in parts)
        except ValueError:
            return False

    def _format_host_result(self, host: Dict) -> Dict[str, Any]:
        """Форматує результат host lookup."""
        data = host.get("data", [])
        ports = [d.get("port") for d in data if d.get("port")]
        return {
            "found": True,
            "ip": host.get("ip_str"),
            "org": host.get("org"),
            "os": host.get("os"),
            "ports": ports[:20],
            "indicators": [f"port:{p}" for p in ports[:5]],
            "raw_log": f"Shodan host: {host.get('ip_str')} | org: {host.get('org', 'N/A')} | ports: {ports}",
        }

    def _format_search_result(self, results: Dict, query: str, limit: int = 10) -> Dict[str, Any]:
        """Форматує результат search."""
        matches = results.get("matches", [])[:limit]
        total = results.get("total", 0)
        indicators = []
        for m in matches[:5]:
            ip = m.get("ip_str")
            port = m.get("port")
            if ip:
                indicators.append(f"{ip}:{port}" if port else ip)
        return {
            "found": len(matches) > 0,
            "total": total,
            "matches_count": len(matches),
            "indicators": indicators,
            "raw_log": f"Shodan search '{query}': {total} total, {len(matches)} returned",
        }
