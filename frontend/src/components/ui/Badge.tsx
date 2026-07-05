import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variants: Record<string, string> = {
  default: "bg-surface-2 text-text-dim border-border",
  success: "bg-risk-low/10 text-risk-low border-risk-low/30",
  warning: "bg-risk-medium/10 text-risk-medium border-risk-medium/30",
  danger: "bg-risk-high/10 text-risk-high border-risk-high/30",
  info: "bg-accent/10 text-accent border-accent/30",
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

const riskVariant: Record<RiskLevel, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <Badge variant={riskVariant[risk]}>
      {risk.toUpperCase()}
    </Badge>
  );
}
