import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
  accent?: boolean;
}

export function StatCard({ label, value, icon, trend, accent }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              accent ? "bg-accent/10 text-accent" : "bg-surface-2 text-text-dim"
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-text">{value}</div>
      {trend && (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            trend.positive ? "text-risk-low" : "text-risk-high"
          )}
        >
          {trend.value}
        </div>
      )}
    </Card>
  );
}
