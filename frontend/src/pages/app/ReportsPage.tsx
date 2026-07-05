import { FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCleanupHistory } from "@/hooks/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function ReportsPage() {
  const { data: history, isLoading } = useCleanupHistory();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Reports</h1>
        <p className="text-sm text-text-dim">
          Professional PDF summaries for every cleanup — deleted resources, savings, risk summary.
        </p>
      </div>

      {isLoading && <p className="text-sm text-text-dim">Loading reports…</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {history?.map((h) => (
          <Card key={h.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-text">Cleanup report · {h.id}</p>
                  <p className="text-xs text-text-faint">{formatDateTime(h.startedAt)}</p>
                </div>
              </div>
              <Badge variant={h.status === "completed" ? "success" : "danger"}>{h.status}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-text">{h.resourcesDeleted}</p>
                <p className="text-xs text-text-faint">Deleted</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-text">{h.resourcesFailed}</p>
                <p className="text-xs text-text-faint">Failed</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-risk-low">{formatCurrency(h.savings)}</p>
                <p className="text-xs text-text-faint">Saved / mo</p>
              </div>
            </div>
            <a href={`/api/reports/cleanup/${h.id}.pdf`} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="mt-4 w-full" icon={<Download className="h-3.5 w-3.5" />}>
                Download PDF report
              </Button>
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
