"""
Maigret Provider - реальний пошук нікнейму на 2500+ сайтах.
Використовує бібліотеку maigret або subprocess як fallback.
"""

import json
import logging
import subprocess
import sys
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _check_maigret_installed() -> bool:
    """Перевірка наявності пакету maigret перед запуском."""
    try:
        import maigret  # noqa: F401
        return True
    except ImportError:
        return False


def _run_via_subprocess(username: str, limit: int = 50) -> Optional[Dict[str, Any]]:
    """Fallback: запуск через CLI maigret --json simple."""
    import tempfile
    import os
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            proc = subprocess.run(
                [
                    sys.executable, "-m", "maigret", username,
                    "--json", "simple",
                    "--folderoutput", tmpdir,
                    "--top-sites", str(min(limit, 200)),
                    "--timeout", "25",
                ],
                capture_output=True,
                text=True,
                timeout=90,
                cwd=tmpdir,
            )
            if proc.returncode != 0 and proc.stderr:
                logger.warning(f"Maigret subprocess stderr: {proc.stderr[:500]}")
            # Maigret writes JSON to folder: report_username.json or similar
            for fname in os.listdir(tmpdir):
                if fname.endswith(".json"):
                    with open(os.path.join(tmpdir, fname), encoding="utf-8") as f:
                        data = json.load(f)
                    return _normalize_maigret_result(data, username)
    except subprocess.TimeoutExpired:
        logger.warning("Maigret subprocess timed out")
    except Exception as e:
        logger.warning(f"Maigret subprocess failed: {e}")
    return None


def _normalize_maigret_result(raw: Any, username: str) -> Dict[str, Any]:
    """
    Нормалізація результату Maigret у єдиний формат:
    { found, sites, profiles, urls, indicators, raw_log }
    Maigret JSON: { "username": { "SiteName": {"url": "...", "status": "Claimed"}, ... } }
    """
    sites: List[Dict[str, str]] = []
    urls: List[str] = []
    indicators: List[str] = []

    def add_site(site_name: str, url: str = "", status: str = "found") -> None:
        if url and url not in urls:
            urls.append(url)
            indicators.append(url)
        sites.append({"site": site_name, "url": url, "status": status})

    if isinstance(raw, dict):
        # Maigret format: { "ids": { "username": {"SiteName": {...}} } } or { "SiteName": {...} }
        data: Any = raw.get("ids", raw)
        if isinstance(data, dict) and username in data:
            data = data[username]
        elif isinstance(raw, dict) and username in raw:
            data = raw[username]
        if isinstance(data, dict):
            for site_name, info in data.items():
                if isinstance(info, dict):
                    url = info.get("url") or info.get("link") or info.get("profile_url") or ""
                    status = info.get("status", "Claimed") if url else "Not found"
                    add_site(site_name, url, status)
                elif isinstance(info, str) and info.startswith("http"):
                    add_site(site_name, info, "found")
        for key in ("sites", "profiles", "urls"):
            if key in raw and isinstance(raw[key], list):
                for s in raw[key]:
                    if isinstance(s, dict):
                        add_site(s.get("site", s.get("name", "?")), s.get("url", ""), s.get("status", "found"))
                    elif isinstance(s, str) and s.startswith("http"):
                        add_site("link", s, "found")
    elif isinstance(raw, list):
        for item in raw:
            if isinstance(item, dict):
                add_site(
                    item.get("site", item.get("name", "unknown")),
                    item.get("url") or item.get("link") or "",
                    item.get("status", "found"),
                )
            elif isinstance(item, str) and item.startswith("http"):
                add_site("link", item, "found")

    return {
        "found": len(sites) > 0 or len(urls) > 0,
        "sites": sites,
        "profiles": sites,
        "urls": urls,
        "indicators": indicators[:50],
        "raw_log": f"Maigret: знайдено {len(sites)} профілів для '{username}'",
    }


class MaigretProvider:
    """Провайдер для Maigret (Social Search)."""

    def run(
        self,
        query: str,
        api_key: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Пошук нікнейму на 2500+ сайтах.
        query: username для пошуку
        options: limit (10-100), depth (1-5)
        """
        username = (query or "").strip()
        if not username:
            return {"found": False, "sites": [], "urls": [], "indicators": [], "raw_log": "Empty username"}

        if not _check_maigret_installed():
            logger.warning("Maigret not installed. Run: pip install maigret")
            return None

        opts = options or {}
        limit = min(100, max(10, int(opts.get("limit", 30))))
        return _run_via_subprocess(username, limit)
