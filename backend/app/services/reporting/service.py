"""Report orchestration.

Reports never depend on the AI layer being up: if narrative is unavailable, the
deterministic report is produced without it and the caller is told why.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.repositories.audit_log import AuditLogRepository
from app.schemas.report import ReportFormat, ReportRequest
from app.services.ai.service import AIService
from app.services.analytics.service import AnalyticsService
from app.services.reporting.charts import build_chart_set
from app.services.reporting.pdf import build_pdf
from app.services.reporting.pptx import build_pptx

logger = get_logger(__name__)

_CONTENT_TYPES = {
    ReportFormat.PDF: "application/pdf",
    ReportFormat.PPTX: (
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ),
}

_UNSAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


@dataclass(frozen=True)
class GeneratedReport:
    content: bytes
    filename: str
    content_type: str
    report_format: ReportFormat


class ReportService:
    def __init__(self, session: AsyncSession, organization_id: uuid.UUID) -> None:
        self.session = session
        self.organization_id = organization_id
        self.analytics = AnalyticsService(session, organization_id)
        self.ai = AIService(session, organization_id)
        self.audit = AuditLogRepository(session, organization_id)

    async def generate(
        self,
        request: ReportRequest,
        *,
        organization_name: str,
        user_id: uuid.UUID | None = None,
        actor_email: str | None = None,
    ) -> GeneratedReport:
        run, result = await self.analytics.get_run(request.analysis_run_id)

        insights = None
        if request.include_ai_narrative:
            # Reuse persisted narrative when present; never block the export on
            # a live generation call.
            insights = await self.ai.get_bundle(request.analysis_run_id)
            if insights is None:
                logger.info(
                    "report_without_narrative",
                    extra={"run_id": str(request.analysis_run_id)},
                )

        charts = build_chart_set(result) if request.include_charts else {}

        builder = build_pdf if request.format is ReportFormat.PDF else build_pptx
        content = builder(
            result=result,
            charts=charts,
            insights=insights,
            organization_name=organization_name,
            title=request.title,
            include_charts=request.include_charts,
        )

        filename = self._filename(
            organization_name, result.period.start.isoformat(),
            result.period.end.isoformat(), request.format,
        )

        await self.audit.record(
            action="report.export",
            resource_type="analysis_run",
            resource_id=str(run.id),
            user_id=user_id,
            actor_email=actor_email,
            context={"format": request.format.value, "size_bytes": len(content)},
        )
        await self.session.commit()

        return GeneratedReport(
            content=content,
            filename=filename,
            content_type=_CONTENT_TYPES[request.format],
            report_format=request.format,
        )

    async def generate_generic(
        self,
        request: GenericReportRequest,
        *,
        organization_name: str,
        user_id: uuid.UUID | None = None,
        actor_email: str | None = None,
    ) -> GeneratedReport:
        from app.services.analytics.generic_service import GenericAnalyticsService
        from app.services.reporting.pdf import build_generic_pdf
        
        generic_service = GenericAnalyticsService(self.session, self.organization_id)
        
        # Analyze dataset to get narrative and stats
        result = await generic_service.analyze_and_generate(request.dataset_id)
        
        filename = f"{organization_name[:20].lower().replace(' ', '_')}_{result['filename'][:20].replace(' ', '_')}_report.pdf"
        filename = _UNSAFE_FILENAME.sub("", filename.replace(".pdf", "")) + ".pdf"
        
        content = build_generic_pdf(
            result=result,
            organization_name=organization_name,
            title=request.title or f"Generic Analysis: {result['filename']}",
            include_charts=request.include_charts,
            include_narrative=request.include_ai_narrative,
        )
        
        await self.audit.record(
            action="report.export_generic",
            resource_type="dataset",
            resource_id=str(request.dataset_id),
            user_id=user_id,
            actor_email=actor_email,
            context={"format": request.format.value, "size_bytes": len(content)},
        )
        await self.session.commit()
        
        return GeneratedReport(
            content=content,
            filename=filename,
            content_type=_CONTENT_TYPES[ReportFormat.PDF],
            report_format=ReportFormat.PDF,
        )

    def _filename(self, org: str, start: str, end: str, fmt: ReportFormat) -> str:
        safe_org = _UNSAFE_FILENAME.sub("", org.lower().replace(" ", "_"))
        return f"{safe_org}_{start}_to_{end}_report.{fmt.value}"


__all__ = ["GeneratedReport", "ReportService"]
