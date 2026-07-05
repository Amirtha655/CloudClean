import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Network,
  Sparkles,
  ClipboardList,
  CalendarClock,
  LayoutTemplate,
  LineChart,
  History,
  FileText,
  Bell,
  ShieldCheck,
  Cloud,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/explorer", label: "Resource Explorer", icon: Search },
  { to: "/app/dependencies", label: "Dependency Graph", icon: Network },
  { to: "/app/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/app/planner", label: "Cleanup Planner", icon: ClipboardList },
  { to: "/app/scheduled", label: "Scheduled Cleanup", icon: CalendarClock },
  { to: "/app/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/app/cost", label: "Cost Analytics", icon: LineChart },
  { to: "/app/history", label: "Cleanup History", icon: History },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/admin", label: "Admin", icon: ShieldCheck },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <Cloud className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-text">CloudClean</span>
      </div>
      <nav className="mono-scroll flex-1 overflow-y-auto px-3 py-4">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-surface-2 text-text"
                  : "text-text-dim hover:bg-surface-2 hover:text-text"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <NavLink
          to="/app/accounts"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              isActive ? "bg-surface-2 text-text" : "text-text-dim hover:bg-surface-2 hover:text-text"
            )
          }
        >
          <Settings className="h-4 w-4" />
          AWS Accounts
        </NavLink>
      </div>
    </aside>
  );
}
