import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}

const variants: Record<string, string> = {
  primary: "gradient-bg text-white shadow-sm shadow-accent-dim/20 hover:opacity-90",
  secondary: "bg-surface text-text border border-border hover:border-border-hover",
  ghost: "bg-transparent text-text-dim hover:text-text hover:bg-surface-2",
  danger: "bg-risk-high/10 text-risk-high border border-risk-high/30 hover:bg-risk-high/20",
};

const sizes: Record<string, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-6 py-3 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
