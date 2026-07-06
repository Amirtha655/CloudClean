import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AwsAccount } from "@/types";
import { useCurrentUser } from "@/hooks/queries";

export function Topbar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | null>(null);

  const { data: accounts } = useQuery<AwsAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get("/accounts")).data,
  });
  const { data: user } = useCurrentUser();

  const active = accounts?.[0];

  function logout() {
    localStorage.removeItem("cloudclean_token");
    navigate("/login");
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-low" />
        {active ? `${active.name} · ${active.awsAccountId}` : "No account connected"}
        <ChevronDown className="h-3.5 w-3.5" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            className="text-text-dim hover:text-text"
            onClick={() => setOpenMenu(openMenu === "notifications" ? null : "notifications")}
          >
            <Bell className="h-4.5 w-4.5" />
          </button>
          {openMenu === "notifications" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-border bg-surface p-3 shadow-lg">
                <p className="text-xs font-medium text-text">Notifications</p>
                <p className="mt-2 text-xs text-text-faint">No new notifications yet.</p>
                <button
                  className="mt-3 flex items-center gap-1.5 text-xs text-accent hover:underline"
                  onClick={() => {
                    setOpenMenu(null);
                    navigate("/app/notifications");
                  }}
                >
                  <Settings className="h-3 w-3" />
                  Notification settings
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent-dim"
            onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
          />
          {openMenu === "profile" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-surface p-3 shadow-lg">
                <p className="truncate text-sm font-medium text-text">{user?.name || "…"}</p>
                <p className="truncate text-xs text-text-faint">{user?.email || ""}</p>
                <div className="my-2 border-t border-border" />
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-dim hover:bg-surface-2 hover:text-text"
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
