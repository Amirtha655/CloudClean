import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { Button } from "@/components/ui/Button";
import { useRecommendations } from "@/hooks/queries";
import { formatCurrency } from "@/lib/utils";

const actionVariant: Record<string, "danger" | "warning" | "info"> = {
  Terminate: "danger",
  Delete: "warning",
  Release: "info",
};

export function RecommendationsPage() {
  const { data: recs, isLoading } = useRecommendations();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function sendToPlanner() {
    const ids = recs?.filter((r) => selected.has(r.id)).map((r) => r.resourceId) ?? [];
    sessionStorage.setItem("cloudclean_plan_ids", JSON.stringify(ids));
    navigate("/app/planner");
  }

  const totalSavings = recs?.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.estimatedSavings, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Smart Recommendations</h1>
          <p className="text-sm text-text-dim">{recs?.length ?? 0} suggested actions across your accounts.</p>
        </div>
        {selected.size > 0 && (
          <Button onClick={sendToPlanner}>
            Add {selected.size} to plan · {formatCurrency(totalSavings)}/mo
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-text-dim">Analyzing resources…</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {recs?.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-medium text-text">{r.resourceName}</span>
                </div>
                <p className="mt-1 text-xs text-text-faint">{r.service}</p>
              </div>
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="mt-1"
              />
            </div>
            <p className="mt-3 text-sm text-text-dim">{r.reason}</p>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant={actionVariant[r.action] ?? "default"}>{r.action}</Badge>
              <span className="text-sm font-medium text-text">{formatCurrency(r.estimatedSavings)}/mo</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-faint">Confidence</span>
              <ConfidenceBar value={r.confidence} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
