import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db import models

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/cleanup/{history_id}.pdf")
def cleanup_report(history_id: str, db: Session = Depends(get_db)):
    history = db.get(models.CleanupHistory, history_id)
    if not history:
        raise HTTPException(404, "Cleanup run not found")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, title="CloudClean Cleanup Report")
    styles = getSampleStyleSheet()
    story = [
        Paragraph("CloudClean Cleanup Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"Run: {history.id}", styles["Normal"]),
        Paragraph(f"Executed by: {history.user}", styles["Normal"]),
        Paragraph(f"Started: {history.started_at}", styles["Normal"]),
        Paragraph(f"Finished: {history.finished_at}", styles["Normal"]),
        Paragraph(f"Status: {history.status}", styles["Normal"]),
        Spacer(1, 16),
    ]

    data = [
        ["Metric", "Value"],
        ["Resources Deleted", str(history.resources_deleted)],
        ["Resources Failed", str(history.resources_failed)],
        ["Estimated Savings", f"${history.savings:,.2f}/mo"],
    ]
    table = Table(data, colWidths=[220, 220])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b0e14")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)

    if history.resource_names:
        story.append(Spacer(1, 16))
        story.append(Paragraph("Deleted Resources", styles["Heading3"]))
        for name in history.resource_names:
            story.append(Paragraph(f"• {name}", styles["Normal"]))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cloudclean-report-{history.id}.pdf"},
    )
