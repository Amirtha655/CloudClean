import { useEffect, useRef } from "react";
import { Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCleanupHistory, useInvalidateScanResults } from "@/hooks/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const statusVariant = {
  completed: "success" as const,
  failed: "danger" as const,
  running: "info" as const,
  pending: "default" as const,
};

export function CleanupHistoryPage() {
  const { data: history, isLoading } = useCleanupHistory();
  const invalidate = useInvalidateScanResults();
  const wasRunning = useRef(false);

  useEffect(() => {
    const running = history?.some((h) => h.status === "running") ?? false;
    if (wasRunning.current && !running) invalidate();
    wasRunning.current = running;
  }, [history, invalidate]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Cleanup History</h1>
        <p className="text-sm text-text-dim">Every cleanup run, who triggered it, and what it saved.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="mono-scroll overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-4 py-3">Run</th>
                <th className="px-2 py-3">User</th>
                <th className="px-2 py-3">Started</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Deleted</th>
                <th className="px-2 py-3">Failed</th>
                <th className="px-2 py-3">Savings</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-text-dim">Loading…</td>
                </tr>
              )}
              {history?.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-text-faint">{h.id}</td>
                  <td className="px-2 py-2.5 text-text-dim">{h.user}</td>
                  <td className="px-2 py-2.5 text-text-dim">{formatDateTime(h.startedAt)}</td>
                  <td className="px-2 py-2.5">
                    <Badge variant={statusVariant[h.status]}>
                      {h.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                      {h.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-2.5 text-text">{h.resourcesDeleted}</td>
                  <td className="px-2 py-2.5 text-text">{h.resourcesFailed}</td>
                  <td className="px-2 py-2.5 text-risk-low">{formatCurrency(h.savings)}/mo</td>
                  <td className="px-2 py-2.5">
                    {h.status !== "running" && (
                      <a href={`/api/reports/cleanup/${h.id}.pdf`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5" />}>
                          PDF
                        </Button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
