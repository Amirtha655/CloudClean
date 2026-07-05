import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { Boxes, DollarSign, ShieldAlert, Sparkles } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useDashboardSummary } from "@/hooks/queries";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#38bdf8", "#7dd3fc", "#0ea5e9", "#4ade80", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#94a3b8", "#34d399"];

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return <div className="text-sm text-text-dim">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Dashboard</h1>
        <p className="text-sm text-text-dim">Overview across all connected AWS accounts and regions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Resources" value={data.totalResources.toString()} icon={<Boxes className="h-4 w-4" />} accent />
        <StatCard label="Monthly Cost" value={formatCurrency(data.monthlyCost)} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard
          label="Potential Savings"
          value={formatCurrency(data.potentialSavings)}
          icon={<Sparkles className="h-4 w-4" />}
          trend={{ value: `${data.recommendationCount} recommendations`, positive: true }}
          accent
        />
        <StatCard label="Risk Score" value={`${data.riskScore}/100`} icon={<ShieldAlert className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost & Resource Trend (14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growthTrend}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2430" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5b6472" }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#5b6472" }} />
                <Tooltip
                  contentStyle={{ background: "#11151d", border: "1px solid #1e2430", fontSize: 12 }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Area type="monotone" dataKey="cost" stroke="#38bdf8" fill="url(#costGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources by Service</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byService}
                  dataKey="count"
                  nameKey="service"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {data.byService.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#11151d", border: "1px solid #1e2430", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
              <Bar dataKey="cost" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
