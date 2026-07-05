import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { useCostAnalytics } from "@/hooks/queries";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Sparkles } from "lucide-react";

export function CostAnalyticsPage() {
  const { data, isLoading } = useCostAnalytics();

  if (isLoading || !data) return <p className="text-sm text-text-dim">Loading cost analytics…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Cost Analytics</h1>
        <p className="text-sm text-text-dim">30-day cost trend and breakdown across services and regions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Current Monthly Cost" value={formatCurrency(data.currentCost)} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Potential Savings" value={formatCurrency(data.potentialSavings)} icon={<Sparkles className="h-4 w-4" />} accent />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2430" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5b6472" }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#5b6472" }} />
              <Tooltip contentStyle={{ background: "#11151d", border: "1px solid #1e2430", fontSize: 12 }} />
              <Line type="monotone" dataKey="cost" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Service</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byService} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5b6472" }} />
                <YAxis dataKey="service" type="category" width={90} tick={{ fontSize: 11, fill: "#5b6472" }} />
                <Tooltip contentStyle={{ background: "#11151d", border: "1px solid #1e2430", fontSize: 12 }} />
                <Bar dataKey="cost" fill="#7dd3fc" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by Region</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2430" />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: "#5b6472" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5b6472" }} />
                <Tooltip contentStyle={{ background: "#11151d", border: "1px solid #1e2430", fontSize: 12 }} />
                <Bar dataKey="cost" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Expensive Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Service</th>
                <th className="py-2">Region</th>
                <th className="py-2">Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.topExpensive.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-2 text-text">{r.name}</td>
                  <td className="py-2 text-text-dim">{r.service}</td>
                  <td className="py-2 text-text-dim">{r.region}</td>
                  <td className="py-2 text-text">{formatCurrency(r.monthlyCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
