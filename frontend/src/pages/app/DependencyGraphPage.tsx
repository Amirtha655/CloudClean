import { useState } from "react";
import { AlertTriangle, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { RiskBadge } from "@/components/ui/Badge";
import { useDependencyGraph, useResources } from "@/hooks/queries";

export function DependencyGraphPage() {
  const { data: resources } = useResources({});
  const [resourceId, setResourceId] = useState<string | null>(null);
  const { data: graph, isLoading } = useDependencyGraph(resourceId);

  const root = resources?.find((r) => r.id === resourceId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Dependency Graph</h1>
        <p className="text-sm text-text-dim">
          See what else is affected before you delete a resource.
        </p>
      </div>

      <Card className="p-4">
        <Select
          className="w-full max-w-md"
          value={resourceId ?? ""}
          onChange={(e) => setResourceId(e.target.value || null)}
        >
          <option value="">Select a resource…</option>
          {resources?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.service} · {r.name}
            </option>
          ))}
        </Select>
      </Card>

      {!resourceId && (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Network className="h-6 w-6 text-text-faint" />
          <p className="text-sm text-text-dim">Pick a resource above to trace its dependencies.</p>
        </Card>
      )}

      {resourceId && isLoading && <p className="text-sm text-text-dim">Tracing dependencies…</p>}

      {graph && root && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dependency Chain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-0">
                <div className="rounded-lg border-2 border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-text">
                  {root.service} · {root.name}
                </div>
                {graph.nodes
                  .filter((n) => n.id !== resourceId)
                  .map((n) => (
                    <div key={n.id} className="flex flex-col items-center">
                      <div className="h-6 w-px bg-border-hover" />
                      <div className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-text-dim">
                        {n.service} · {n.label}
                      </div>
                    </div>
                  ))}
                {graph.nodes.length <= 1 && (
                  <p className="mt-4 text-sm text-text-faint">No dependent resources found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">Risk</span>
                <RiskBadge risk={graph.risk} />
              </div>
              {graph.affected.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs text-text-faint">Deleting this will also affect:</p>
                  <ul className="space-y-1.5">
                    {graph.affected.map((name) => (
                      <li key={name} className="flex items-center gap-2 text-sm text-text">
                        <span className="text-risk-low">✓</span> {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-risk-low">
                  <AlertTriangle className="h-4 w-4" />
                  Safe to delete independently.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
