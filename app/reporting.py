"""
OSINT Platform 2026 - Report Generation System
Генерація звітів OSINT досліджень з аналізом та експортом
Професійний PDF: титульна сторінка, Maigret-таблиця, Evidence, Network Graph Summary
"""

from enum import Enum
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import json
import hashlib


def _pdf_safe(text: str) -> str:
    """Sanitize text for PDF (Helvetica supports only Latin-1)"""
    if not text:
        return ""
    s = str(text)[:200]
    return "".join(c if ord(c) < 128 else "?" for c in s)


def parse_maigret_for_table(data: Any) -> List[Tuple[str, str, str]]:
    """
    Парсер результатів Maigret: перетворює JSON на таблицю (Сайт | Посилання | Статус).
    Повертає список кортежів (site, url, status).
    """
    rows: List[Tuple[str, str, str]] = []
    if not data:
        return rows

    def add_row(site: str, url: str, status: str) -> None:
        rows.append((_pdf_safe(site), _pdf_safe(url)[:80], _pdf_safe(status)))

    if isinstance(data, dict):
        sites = data.get("sites") or data.get("profiles") or []
        if isinstance(sites, list) and sites:
            for s in sites:
                if isinstance(s, dict):
                    add_row(
                        s.get("site", s.get("name", "?")) or "?",
                        s.get("url", s.get("link", "")) or "",
                        s.get("status", "Found") or "Found",
                    )
        else:
            for site_name, info in data.items():
                if site_name in ("found", "urls", "indicators", "raw_log", "ids"):
                    continue
                if isinstance(info, dict):
                    url = info.get("url") or info.get("link") or ""
                    status = info.get("status", "Claimed") if url else "Not found"
                    add_row(site_name, url, status)
                elif isinstance(info, str) and info.startswith("http"):
                    add_row(site_name, info, "Found")
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                add_row(
                    item.get("site", item.get("name", "?")) or "?",
                    item.get("url", item.get("link", "")) or "",
                    item.get("status", "Found") or "Found",
                )
            elif isinstance(item, str) and item.startswith("http"):
                add_row("Link", item, "Found")
    return rows

class ReportFormat(str, Enum):
    """Формати експорту звітів"""
    HTML = "html"
    PDF = "pdf"
    JSON = "json"
    MARKDOWN = "markdown"
    CSV = "csv"
    XLSX = "xlsx"

class ReportSectionType(str, Enum):
    """Типи секцій звіту"""
    EXECUTIVE_SUMMARY = "executive_summary"
    OSINT_SEARCH = "osint_search"
    GEOLOCATION = "geolocation"
    NETWORK_INTEL = "network_intel"
    SOCIAL_ANALYSIS = "social_analysis"
    FINANCIAL_DATA = "financial_data"
    THREAT_ASSESSMENT = "threat_assessment"
    EVIDENCE = "evidence"
    RECOMMENDATIONS = "recommendations"
    CONCLUSION = "conclusion"

class ReportGenerator:
    """Генератор комплексних звітів з професійним PDF-експортом"""

    def __init__(self, investigation_id: str, title: str = "", created_at: str = ""):
        self.investigation_id = investigation_id
        self.report_title = title or f"Investigation {investigation_id}"
        self.report_created_at = created_at or datetime.now().isoformat()
        self.report_data = {
            "id": investigation_id,
            "created_at": self.report_created_at,
            "sections": [],
            "metadata": {
                "tools_used": [],
                "evidence_count": 0,
                "confidence_score": 0.0,
                "risk_level": "UNKNOWN"
            }
        }
    
    def add_executive_summary(self, target: str, findings: str, risk_level: str) -> None:
        """Додати виконавчий звіт"""
        section = {
            "type": ReportSectionType.EXECUTIVE_SUMMARY.value,
            "title": "Виконавчий звіт",
            "data": {
                "target": target,
                "key_findings": findings,
                "risk_level": risk_level,
                "generated_at": datetime.now().isoformat()
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["risk_level"] = risk_level
    
    def add_osint_search_results(self, username: str, results: List[Dict]) -> None:
        """Додати результати OSINT пошуку (Maigret, Sherlock)"""
        section = {
            "type": ReportSectionType.OSINT_SEARCH.value,
            "title": "Результати OSINT пошуку",
            "data": {
                "username": username,
                "platforms_found": len(results),
                "results": results,
                "summary": f"Знайдено {len(results)} облікових записів"
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["tools_used"].append("Maigret/Sherlock")
    
    def add_geolocation_data(self, locations: List[Dict]) -> None:
        """Додати геолокаційні дані (GeoSpy, Google Earth)"""
        section = {
            "type": ReportSectionType.GEOLOCATION.value,
            "title": "Геолокаційні дані",
            "data": {
                "locations_found": len(locations),
                "coordinates": locations,
                "map_links": [loc.get("map_url", "") for loc in locations]
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["tools_used"].append("GeoSpy.ai/Google Earth")
    
    def add_network_intelligence(self, infrastructure: List[Dict]) -> None:
        """Додати мережеву розвідку (Shodan, Censys)"""
        section = {
            "type": ReportSectionType.NETWORK_INTEL.value,
            "title": "Мережева розвідка",
            "data": {
                "hosts_found": len(infrastructure),
                "infrastructure": infrastructure,
                "vulnerabilities": sum(1 for h in infrastructure if h.get("vulnerable"))
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["tools_used"].append("Shodan/Censys")

    def to_pdf(self) -> bytes:
        """Професійний PDF: титульна сторінка, Summary, Maigret-таблиця, Evidence, Network Graph, Footer"""
        from fpdf import FPDF

        report_hash = hashlib.sha256(json.dumps(self.report_data, sort_keys=True).encode()).hexdigest()

        class OSINTPDF(FPDF):
            def __init__(self, doc_hash: str):
                super().__init__()
                self.doc_hash = doc_hash

            def header(self):
                self.set_font("helvetica", "B", 10)
                self.set_text_color(0, 106, 106)  # teal
                self.cell(0, 8, "MINIMAX OSINT | Report", border=False, align="L")
                self.set_text_color(0, 0, 0)
                self.set_font("helvetica", "I", 8)
                self.cell(0, 8, datetime.now().strftime("%Y-%m-%d %H:%M"), align="R")
                self.ln(12)

            def footer(self):
                self.set_y(-18)
                self.set_font("helvetica", "I", 7)
                self.set_text_color(100, 100, 100)
                self.cell(0, 6, "CONFIDENTIAL - For authorized use only", align="L")
                self.cell(0, 6, f"Page {self.page_no()}", align="C")
                self.cell(0, 6, f"SHA-256: {self.doc_hash[:16]}...", align="R")
                self.ln(8)

        pdf = OSINTPDF(report_hash)
        pdf.set_auto_page_break(True, margin=25)
        pdf.add_page()

        # Title page
        pdf.set_font("helvetica", "B", 24)
        pdf.set_text_color(0, 106, 106)
        pdf.cell(0, 14, "MINIMAX OSINT", ln=True, align="C")
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Investigation Report", ln=True, align="C")
        pdf.ln(8)
        pdf.set_font("helvetica", "", 12)
        pdf.cell(0, 8, _pdf_safe(self.report_title), ln=True, align="C")
        pdf.cell(0, 8, f"Case ID: {self.investigation_id}", ln=True, align="C")
        pdf.cell(0, 8, f"Date: {self.report_created_at[:10]}", ln=True, align="C")
        pdf.ln(8)

        # Summary
        pdf.set_font("helvetica", "B", 12)
        pdf.set_fill_color(240, 248, 248)
        pdf.cell(0, 10, "Summary", ln=True, fill=True)
        pdf.set_font("helvetica", "", 10)
        pdf.ln(4)
        summary_section = next((s for s in self.report_data["sections"] if s["type"] == ReportSectionType.EXECUTIVE_SUMMARY.value), None)
        if summary_section:
            d = summary_section["data"]
            summary_txt = f"Target: {d.get('target', 'N/A')}\nRisk: {d.get('risk_level', 'N/A')}\n{d.get('key_findings', '')}"
            pdf.multi_cell(0, 7, _pdf_safe(summary_txt))
        pdf.ln(8)

        # Maigret / OSINT table
        osint_section = next((s for s in self.report_data["sections"] if s["type"] == ReportSectionType.OSINT_SEARCH.value), None)
        rows: List[Tuple[str, str, str]] = []
        if osint_section:
            data = osint_section["data"]
            results = data.get("results", [])
            if isinstance(results, list) and results:
                first = results[0]
                if isinstance(first, dict) and ("sites" in first or "profiles" in first):
                    rows = parse_maigret_for_table(first)
                else:
                    rows = parse_maigret_for_table({"sites": results})
            if not rows:
                rows = parse_maigret_for_table(data)
            if rows:
                pdf.set_font("helvetica", "B", 12)
                pdf.set_fill_color(240, 248, 248)
                pdf.cell(0, 10, "Found Platforms (Maigret / OSINT)", ln=True, fill=True)
                pdf.set_font("helvetica", "", 9)
                pdf.ln(4)
                col_w = (55, 95, 35)
                pdf.set_font("helvetica", "B", 9)
                pdf.cell(col_w[0], 8, "Site", border=1)
                pdf.cell(col_w[1], 8, "Direct Link", border=1)
                pdf.cell(col_w[2], 8, "Status", border=1)
                pdf.ln()
                pdf.set_font("helvetica", "", 8)
                for site, url, status in rows[:50]:
                    pdf.cell(col_w[0], 7, site[:30], border=1)
                    pdf.cell(col_w[1], 7, url[:50], border=1)
                    pdf.cell(col_w[2], 7, status[:12], border=1)
                    pdf.ln()
                if len(rows) > 50:
                    pdf.cell(0, 6, f"... and {len(rows) - 50} more", ln=True)
                pdf.ln(8)

        # Network Graph Summary
        graph_nodes = []
        for s in self.report_data["sections"]:
            if s["type"] == ReportSectionType.OSINT_SEARCH.value:
                r = s["data"].get("results", [])
                if isinstance(r, list):
                    for x in r:
                        if isinstance(x, dict) and x.get("url"):
                            graph_nodes.append(x.get("site", "Link"))
                elif isinstance(r, dict):
                    graph_nodes.extend(k for k, v in r.items() if isinstance(v, dict) and v.get("url"))
        if graph_nodes:
            pdf.set_font("helvetica", "B", 12)
            pdf.set_fill_color(240, 248, 248)
            pdf.cell(0, 10, "Network Graph Summary", ln=True, fill=True)
            pdf.set_font("helvetica", "", 10)
            pdf.ln(4)
            graph_txt = f"Central node: Target. Connected platforms: {', '.join(graph_nodes[:15])}."
            if len(graph_nodes) > 15:
                graph_txt += f" (+{len(graph_nodes) - 15} more)"
            pdf.multi_cell(0, 7, _pdf_safe(graph_txt))
            pdf.ln(8)

        # Evidence Table
        ev_section = next((s for s in self.report_data["sections"] if s["type"] == ReportSectionType.EVIDENCE.value), None)
        if ev_section:
            ev_list = ev_section["data"].get("evidence", [])[:20]
            if ev_list:
                pdf.set_font("helvetica", "B", 12)
                pdf.set_fill_color(240, 248, 248)
                pdf.cell(0, 10, "Evidence Table", ln=True, fill=True)
                pdf.set_font("helvetica", "", 8)
                pdf.ln(4)
                for i, ev in enumerate(ev_list):
                    h = ev.get("hash_sha256", "")
                    src = ev.get("source", "unknown")
                    pdf.cell(0, 6, f"#{i+1} {_pdf_safe(src)} | {h[:32]}...", ln=True)
                pdf.ln(8)

        # Chain of Custody
        pdf.add_page()
        pdf.set_font("helvetica", "B", 12)
        pdf.set_fill_color(240, 248, 248)
        pdf.cell(0, 10, "Chain of Custody (Integrity)", ln=True, fill=True)
        pdf.set_font("helvetica", "", 10)
        pdf.ln(6)
        tools_str = ", ".join(set(self.report_data["metadata"]["tools_used"])) if self.report_data["metadata"]["tools_used"] else "N/A"
        meta_txt = f"Evidence Items: {self.report_data['metadata']['evidence_count']}\nTools Used: {tools_str}\nReport SHA-256: {report_hash}"
        pdf.multi_cell(0, 8, _pdf_safe(meta_txt))

        return pdf.output()
    
    def add_social_analysis(self, platforms: List[Dict]) -> None:
        """Додати аналіз соціальних мереж (SOCMINT)"""
        section = {
            "type": ReportSectionType.SOCIAL_ANALYSIS.value,
            "title": "Аналіз соціальних мереж",
            "data": {
                "platforms_analyzed": len(platforms),
                "profiles": platforms,
                "engagement_score": self._calculate_engagement(platforms),
                "activity_pattern": self._analyze_activity(platforms)
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["tools_used"].append("SOCMINT Tools")
    
    def add_financial_data(self, financial_info: Dict) -> None:
        """Додати фінансові дані (OpenSanctions, YouControl 🇺🇦)"""
        section = {
            "type": ReportSectionType.FINANCIAL_DATA.value,
            "title": "Фінансові та корпоративні дані",
            "data": {
                "sanctions_status": financial_info.get("sanctions", "Clear"),
                "pep_status": financial_info.get("pep", "Not PEP"),
                "companies": financial_info.get("companies", []),
                "financial_interests": financial_info.get("interests", []),
                "risk_indicators": financial_info.get("risks", [])
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["tools_used"].append("OpenSanctions/YouControl")
    
    def add_threat_assessment(self, threats: List[Dict]) -> None:
        """Додати оцінку загроз"""
        section = {
            "type": ReportSectionType.THREAT_ASSESSMENT.value,
            "title": "Оцінка загроз і ризиків",
            "data": {
                "threat_count": len(threats),
                "threats": threats,
                "overall_risk": self._calculate_risk_score(threats),
                "mitigations": self._generate_mitigations(threats)
            }
        }
        self.report_data["sections"].append(section)
    
    def add_evidence(self, evidence_list: List[Dict]) -> None:
        """Додати докази з хешуванням для юридичної значущості"""
        processed_evidence = []
        for evidence in evidence_list:
            evidence_hash = hashlib.sha256(
                json.dumps(evidence, sort_keys=True).encode()
            ).hexdigest()
            
            processed_evidence.append({
                **evidence,
                "hash_sha256": evidence_hash,
                "timestamp": datetime.now().isoformat()
            })
        
        section = {
            "type": ReportSectionType.EVIDENCE.value,
            "title": "Збережені докази",
            "data": {
                "evidence_count": len(processed_evidence),
                "evidence": processed_evidence,
                "integrity_verified": True
            }
        }
        self.report_data["sections"].append(section)
        self.report_data["metadata"]["evidence_count"] = len(processed_evidence)
    
    def add_recommendations(self, recommendations: List[str]) -> None:
        """Додати рекомендації"""
        priorities = (["HIGH", "MEDIUM", "LOW"] * (len(recommendations) // 3 + 1))[:len(recommendations)]
        section = {
            "type": ReportSectionType.RECOMMENDATIONS.value,
            "title": "Рекомендації",
            "data": {
                "recommendations": recommendations,
                "priority": priorities
            }
        }
        self.report_data["sections"].append(section)
    
    def add_conclusion(self, conclusion: str) -> None:
        """Додати висновки"""
        section = {
            "type": ReportSectionType.CONCLUSION.value,
            "title": "Висновки",
            "data": {
                "conclusion": conclusion,
                "report_finalized": True,
                "finalized_at": datetime.now().isoformat()
            }
        }
        self.report_data["sections"].append(section)
    
    def generate_json_report(self) -> Dict:
        """Експортувати звіт у JSON"""
        self.report_data["metadata"]["confidence_score"] = \
            len(self.report_data["metadata"]["tools_used"]) / 10.0
        return self.report_data
    
    def generate_markdown_report(self) -> str:
        """Експортувати звіт у Markdown"""
        md = f"""# OSINT Звіт - {self.report_data['id']}

**Дата створення:** {self.report_data['created_at']}

## Резюме
- **Використано інструментів:** {len(self.report_data['metadata']['tools_used'])}
- **Рівень ризику:** {self.report_data['metadata']['risk_level']}
- **Збережено доказів:** {self.report_data['metadata']['evidence_count']}

---

"""
        
        for section in self.report_data["sections"]:
            md += f"## {section['title']}\n\n"
            md += self._markdown_section(section["data"])
            md += "\n---\n\n"
        
        return md
    
    def generate_html_report(self) -> str:
        """Експортувати звіт у HTML"""
        html = f"""<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSINT Звіт - {self.report_data['id']}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        .metadata {{ background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .metadata p {{ margin: 8px 0; }}
        .section {{ margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #3498db; }}
        table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
        table td, table th {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
        table th {{ background: #3498db; color: white; }}
        .risk-high {{ color: #e74c3c; font-weight: bold; }}
        .risk-medium {{ color: #f39c12; font-weight: bold; }}
        .risk-low {{ color: #27ae60; font-weight: bold; }}
        footer {{ text-align: center; margin-top: 40px; color: #7f8c8d; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ OSINT Звіт</h1>
        
        <div class="metadata">
            <p><strong>ID Розслідування:</strong> {self.report_data['id']}</p>
            <p><strong>Дата створення:</strong> {self.report_data['created_at']}</p>
            <p><strong>Використано інструментів:</strong> {len(self.report_data['metadata']['tools_used'])}</p>
            <p><strong>Рівень ризику:</strong> <span class="risk-{self.report_data['metadata']['risk_level'].lower()}">{self.report_data['metadata']['risk_level']}</span></p>
            <p><strong>Збережено доказів:</strong> {self.report_data['metadata']['evidence_count']}</p>
        </div>
"""
        
        for section in self.report_data["sections"]:
            html += f'<div class="section"><h2>{section["title"]}</h2>'
            html += self._html_section(section["data"])
            html += '</div>'
        
        html += """
        <footer>
            <p>Цей звіт містить конфіденційну інформацію та призначений виключно для авторизованого використання.</p>
        </footer>
    </div>
</body>
</html>"""
        
        return html
    
    def generate_csv_report(self) -> str:
        """Експортувати звіт у CSV"""
        csv = "Категорія,Назва,Значення\n"
        
        for section in self.report_data["sections"]:
            csv += f"{section['type']},{section['title']},\n"
            # Додати дані з розділу
            for key, value in section["data"].items():
                csv += f",,{key}: {value}\n"
        
        return csv
    
    @staticmethod
    def _markdown_section(data: Dict) -> str:
        """Форматувати секцію для Markdown"""
        md = ""
        for key, value in data.items():
            if isinstance(value, list):
                md += f"**{key}:** {len(value)} елементів\n"
            elif isinstance(value, dict):
                md += f"**{key}:**\n"
                for k, v in value.items():
                    md += f"- {k}: {v}\n"
            else:
                md += f"**{key}:** {value}\n"
        return md
    
    @staticmethod
    def _html_section(data: Dict) -> str:
        """Форматувати секцію для HTML"""
        html = "<table>"
        for key, value in data.items():
            html += f"<tr><td><strong>{key}</strong></td><td>{value}</td></tr>"
        html += "</table>"
        return html
    
    @staticmethod
    def _calculate_engagement(platforms: List[Dict]) -> float:
        """Розрахувати коефіцієнт активності"""
        if not platforms:
            return 0.0
        total_followers = sum(p.get("followers", 0) for p in platforms)
        total_posts = sum(p.get("posts", 0) for p in platforms)
        return min((total_followers + total_posts) / 10000, 1.0)
    
    @staticmethod
    def _analyze_activity(platforms: List[Dict]) -> str:
        """Аналізувати активність"""
        if not platforms:
            return "Неактивний"
        avg_posts = sum(p.get("posts", 0) for p in platforms) / len(platforms)
        if avg_posts > 100:
            return "Дуже активний"
        elif avg_posts > 50:
            return "Активний"
        elif avg_posts > 10:
            return "Помірно активний"
        else:
            return "Низька активність"
    
    @staticmethod
    def _calculate_risk_score(threats: List[Dict]) -> float:
        """Розрахувати загальний рівень ризику"""
        if not threats:
            return 0.0
        high_count = sum(1 for t in threats if t.get("severity") == "HIGH")
        medium_count = sum(1 for t in threats if t.get("severity") == "MEDIUM")
        return min((high_count * 0.4 + medium_count * 0.2) / 10, 1.0)
    
    @staticmethod
    def _generate_mitigations(threats: List[Dict]) -> List[str]:
        """Згенерувати рекомендації по зниженню ризиків"""
        mitigations = []
        for threat in threats:
            if threat.get("severity") == "HIGH":
                mitigations.append(f"НЕГАЙНО: {threat.get('description')}")
            elif threat.get("severity") == "MEDIUM":
                mitigations.append(f"Рекомендується: {threat.get('description')}")
        return mitigations


class AnalysisGenerator:
    """Генератор аналізу OSINT даних"""
    
    @staticmethod
    def generate_threat_assessment(data: Dict) -> Dict:
        """Згенерувати оцінку загроз"""
        threats = []
        
        # Аналіз соціальних мереж
        if data.get("social_profiles", []):
            threats.append({
                "category": "SOCMINT",
                "description": "Знайдено активні соціальні профілі",
                "severity": "MEDIUM",
                "count": len(data.get("social_profiles", []))
            })
        
        # Аналіз інфраструктури
        if data.get("infrastructure", []):
            threats.append({
                "category": "SIGINT",
                "description": "Виявлена інтернет інфраструктура",
                "severity": "MEDIUM",
                "count": len(data.get("infrastructure", []))
            })
        
        # Аналіз витоків
        if data.get("breaches", []):
            threats.append({
                "category": "DARKWEB",
                "description": f"Знайдено {len(data.get('breaches', []))} витоків даних",
                "severity": "HIGH",
                "count": len(data.get("breaches", []))
            })
        
        # Аналіз санкцій
        if data.get("sanctions_hits"):
            threats.append({
                "category": "FININT",
                "description": "ПОПЕРЕДЖЕННЯ: Виявлені збіги у санкційних списках",
                "severity": "HIGH",
                "count": 1
            })
        
        return {
            "total_threats": len(threats),
            "high_severity": sum(1 for t in threats if t["severity"] == "HIGH"),
            "threats": threats
        }
    
    @staticmethod
    def generate_recommendations(analysis: Dict) -> List[str]:
        """Згенерувати рекомендації на основі аналізу"""
        recommendations = []
        
        if analysis["high_severity"] > 0:
            recommendations.append("🔴 НЕГАЙНА: Провести детальну перевірку виявлених загроз")
        
        if analysis["total_threats"] > 5:
            recommendations.append("🟠 Розглянути контакти з відповідними органами")
        
        recommendations.append("🔵 Зберегти всі докази з хешуванням (SHA-256)")
        recommendations.append("🟢 Налаштувати моніторинг виявлених облікових записів")
        recommendations.append("🟡 Проаналізувати соціальні мережі на предмет нового контенту")
        
        return recommendations


class ReportExporter:
    """Експортер звітів у різні формати"""
    
    @staticmethod
    def export(report_data: Dict, format: ReportFormat) -> Any:
        """Експортувати звіт у вказаному форматі"""
        
        if format == ReportFormat.JSON:
            return json.dumps(report_data, ensure_ascii=False, indent=2)
        
        elif format == ReportFormat.HTML:
            generator = ReportGenerator(report_data["id"])
            generator.report_data = report_data
            return generator.generate_html_report()
        
        elif format == ReportFormat.MARKDOWN:
            generator = ReportGenerator(report_data["id"])
            generator.report_data = report_data
            return generator.generate_markdown_report()
        
        elif format == ReportFormat.CSV:
            generator = ReportGenerator(report_data["id"])
            generator.report_data = report_data
            return generator.generate_csv_report()
        
        else:
            raise ValueError(f"Unsupported format: {format}")


# Приклад використання
if __name__ == "__main__":
    report = ReportGenerator("investigation_001")
    
    report.add_executive_summary(
        target="john_doe",
        findings="Знайдено активність у 12 місцях",
        risk_level="MEDIUM"
    )
    
    report.add_osint_search_results(
        "john_doe",
        [
            {"platform": "Twitter", "url": "https://twitter.com/johndoe"},
            {"platform": "Reddit", "url": "https://reddit.com/u/johndoe"}
        ]
    )
    
    analysis = AnalysisGenerator.generate_threat_assessment({
        "social_profiles": [1, 2],
        "infrastructure": [1],
        "breaches": [1],
        "sanctions_hits": False
    })
    
    report.add_threat_assessment(analysis["threats"])
    report.add_recommendations(AnalysisGenerator.generate_recommendations(analysis))
    report.add_conclusion("Рекомендується подальше дослідження.")
    
    # Експорт
    print(report.generate_markdown_report())
