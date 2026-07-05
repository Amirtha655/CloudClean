import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { RiskBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useResources, type ResourceFilters } from "@/hooks/queries";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"];
const SERVICES = ["EC2", "Lambda", "S3", "RDS", "EBS", "ElasticIP", "SecurityGroup", "LoadBalancer", "DynamoDB", "ECS"];
const ENVIRONMENTS = ["production", "staging", "development", "testing"];

export function ResourceExplorerPage() {
  const [filters, setFilters] = useState<ResourceFilters>({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const activeFilters = useMemo(() => ({ ...filters, search: search || undefined }), [filters, search]);
  const { data: resources, isLoading } = useResources(activeFilters);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function sendToPlanner() {
    sessionStorage.setItem("cloudclean_plan_ids", JSON.stringify([...selected]));
    navigate("/app/planner");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Resource Explorer</h1>
          <p className="text-sm text-text-dim">{resources?.length ?? 0} resources match your filters.</p>
        </div>
        {selected.size > 0 && (
          <Button onClick={sendToPlanner}>Plan cleanup ({selected.size})</Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
            <Input
              className="pl-8"
              placeholder="Search by name, ARN, or resource ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={filters.region ?? ""}
            onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined })}
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Select
            value={filters.service ?? ""}
            onChange={(e) => setFilters({ ...filters, service: e.target.value || undefined })}
          >
            <option value="">All services</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select
            value={filters.environment ?? ""}
            onChange={(e) => setFilters({ ...filters, environment: e.target.value || undefined })}
          >
            <option value="">All environments</option>
            {ENVIRONMENTS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </Select>
          <Select
            value={filters.risk ?? ""}
            onChange={(e) => setFilters({ ...filters, risk: e.target.value || undefined })}
          >
            <option value="">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </Select>
          <Select
            value={filters.unused === undefined ? "" : String(filters.unused)}
            onChange={(e) =>
              setFilters({ ...filters, unused: e.target.value === "" ? undefined : e.target.value === "true" })
            }
          >
            <option value="">All resources</option>
            <option value="true">Unused only</option>
            <option value="false">In use only</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="mono-scroll overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-2 py-3">Name</th>
                <th className="px-2 py-3">Service</th>
                <th className="px-2 py-3">Region</th>
                <th className="px-2 py-3">State</th>
                <th className="px-2 py-3">Environment</th>
                <th className="px-2 py-3">Owner</th>
                <th className="px-2 py-3">Monthly Cost</th>
                <th className="px-2 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-text-dim">Loading…</td>
                </tr>
              )}
              {resources?.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-medium text-text">{r.name}</div>
                    <div className="font-mono text-xs text-text-faint">{r.id}</div>
                  </td>
                  <td className="px-2 py-2.5 text-text-dim">{r.service}</td>
                  <td className="px-2 py-2.5 text-text-dim">{r.region}</td>
                  <td className="px-2 py-2.5 text-text-dim">{r.state}</td>
                  <td className="px-2 py-2.5 text-text-dim">{r.environment}</td>
                  <td className="px-2 py-2.5 text-text-dim">{r.owner}</td>
                  <td className="px-2 py-2.5 text-text">{formatCurrency(r.monthlyCost)}</td>
                  <td className="px-2 py-2.5">
                    <RiskBadge risk={r.riskScore} />
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
