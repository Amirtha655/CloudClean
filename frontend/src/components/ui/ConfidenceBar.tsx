export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-risk-low" : value >= 50 ? "bg-risk-medium" : "bg-risk-high";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-text-dim">{value}%</span>
    </div>
  );
}
