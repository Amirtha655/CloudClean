import { Cloud, Scan, Boxes, PiggyBank, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useAdminStats } from "@/hooks/queries";
import { formatCurrency } from "@/lib/utils";

export function AdminPage() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) return <p className="text-sm text-text-dim">Loading platform stats…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Admin Dashboard</h1>
        <p className="text-sm text-text-dim">Platform-wide statistics across all connected accounts.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Connected Accounts" value={String(data.connectedAccounts)} icon={<Cloud className="h-4 w-4" />} accent />
        <StatCard label="Total Scans" value={String(data.totalScans)} icon={<Scan className="h-4 w-4" />} />
        <StatCard label="Resources Managed" value={String(data.resourcesManaged)} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label="Savings Generated" value={formatCurrency(data.savingsGenerated)} icon={<PiggyBank className="h-4 w-4" />} accent />
        <StatCard label="Active Users" value={String(data.activeUsers)} icon={<Users className="h-4 w-4" />} />
      </div>
    </div>
  );
}
