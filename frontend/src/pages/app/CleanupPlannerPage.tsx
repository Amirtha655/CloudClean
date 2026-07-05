import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, PlayCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/Badge";
import { useCreatePlan, useExecutePlan, useResources } from "@/hooks/queries";
import { formatCurrency } from "@/lib/utils";
import type { CleanupPlan } from "@/types";

const ENVIRONMENTS = ["production", "staging", "development", "testing"];

export function CleanupPlannerPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<CleanupPlan | null>(null);
  const [result, setResult] = useState<{ dryRun: boolean; deleted: number; savings: number } | null>(null);

  const { data: resources } = useResources({});
  const createPlan = useCreatePlan();
  const executePlan = useExecutePlan();

  useEffect(() => {
    const stored = sessionStorage.getItem("cloudclean_plan_ids");
    if (stored) {
      setSelected(new Set(JSON.parse(stored)));
      sessionStorage.removeItem("cloudclean_plan_ids");
    }
  }, []);

  const selectedResources = useMemo(
    () => resources?.filter((r) => selected.has(r.id)) ?? [],
    [resources, selected]
  );

  function setEnvironment(env: string, action: "keep" | "delete") {
    if (!resources) return;
    setSelected((prev) => {
      const next = new Set(prev);
      resources.filter((r) => r.environment === env).forEach((r) => {
        action === "delete" ? next.add(r.id) : next.delete(r.id);
      });
      return next;
    });
    setPlan(null);
    setResult(null);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setPlan(null);
    setResult(null);
  }

  function buildPlan() {
    createPlan.mutate([...selected], { onSuccess: (data) => setPlan(data) });
  }

  function runDryRun() {
    if (!plan) return;
    executePlan.mutate(
      { planId: plan.id, dryRun: true },
      {
        onSuccess: () =>
          setResult({ dryRun: true, deleted: plan.totalCount, savings: plan.estimatedSavings }),
      }
    );
  }

  function execute() {
    if (!plan) return;
    executePlan.mutate(
      { planId: plan.id, dryRun: false },
      {
        onSuccess: (data) => {
          setResult({ dryRun: false, deleted: data.resourcesDeleted, savings: data.savings });
          setSelected(new Set());
          setPlan(null);
        },
      }
    );
  }

  function downloadPlan() {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudclean-plan-${plan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Cleanup Planner</h1>
        <p className="text-sm text-text-dim">Select resources, preview the plan, then dry-run before executing.</p>
      </div>

      <Card className="p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-text-faint">Quick select by environment</p>
        <div className="flex flex-wrap gap-2">
          {ENVIRONMENTS.map((env) => (
            <div key={env} className="flex items-center gap-1 rounded-md border border-border p-1">
              <span className="px-2 text-xs text-text-dim">{env}</span>
              <Button size="sm" variant="secondary" onClick={() => setEnvironment(env, "keep")}>
                Keep
              </Button>
              <Button size="sm" variant="danger" onClick={() => setEnvironment(env, "delete")}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Selected Resources ({selected.size})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResources.length === 0 ? (
              <p className="text-sm text-text-faint">
                No resources selected yet. Pick resources from the Resource Explorer, Recommendations, or the
                environment shortcuts above.
              </p>
            ) : (
              <div className="mono-scroll max-h-80 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {selectedResources.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="w-8 py-2">
                          <input type="checkbox" checked onChange={() => toggle(r.id)} />
                        </td>
                        <td className="py-2 text-text">{r.name}</td>
                        <td className="py-2 text-text-dim">{r.service}</td>
                        <td className="py-2 text-text-dim">{r.environment}</td>
                        <td className="py-2 text-text">{formatCurrency(r.monthlyCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button
              className="mt-4"
              disabled={selected.size === 0 || createPlan.isPending}
              onClick={buildPlan}
            >
              {createPlan.isPending ? "Building plan…" : "Build cleanup plan"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!plan && <p className="text-sm text-text-faint">Build a plan to see estimated savings and warnings.</p>}
            {plan && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-dim">Total resources</span>
                    <span className="text-text">{plan.totalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-dim">Estimated savings</span>
                    <span className="font-medium text-risk-low">{formatCurrency(plan.estimatedSavings)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-dim">Estimated duration</span>
                    <span className="text-text">{plan.estimatedDurationMinutes} min</span>
                  </div>
                </div>

                {plan.warnings.length > 0 && (
                  <div className="space-y-2 rounded-md border border-risk-high/30 bg-risk-high/5 p-3">
                    {plan.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-high" />
                        <div>
                          <p className="text-text">{w.message}</p>
                          <RiskBadge risk={w.risk} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button variant="secondary" icon={<PlayCircle className="h-3.5 w-3.5" />} onClick={runDryRun}>
                    Dry run (preview only)
                  </Button>
                  <Button variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={downloadPlan}>
                    Download plan
                  </Button>
                  <Button variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={execute}>
                    Execute cleanup
                  </Button>
                </div>

                {result && (
                  <div className="rounded-md border border-border bg-surface-2 p-3 text-xs text-text-dim">
                    {result.dryRun
                      ? `Dry run complete — would delete ${result.deleted} resources, saving ${formatCurrency(result.savings)}/mo. Nothing was changed.`
                      : `Cleanup complete — deleted ${result.deleted} resources, saving ${formatCurrency(result.savings)}/mo.`}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
