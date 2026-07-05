import { Bell, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AwsAccount } from "@/types";

export function Topbar() {
  const { data: accounts } = useQuery<AwsAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get("/accounts")).data,
  });

  const active = accounts?.[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-low" />
        {active ? `${active.name} · ${active.awsAccountId}` : "No account connected"}
        <ChevronDown className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-text-dim hover:text-text">
          <Bell className="h-4.5 w-4.5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent-dim" />
      </div>
    </header>
  );
}
