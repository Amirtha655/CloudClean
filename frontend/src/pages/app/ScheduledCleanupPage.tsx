import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useScheduledCleanups, useTemplates, useToggleSchedule } from "@/hooks/queries";
import { formatDateTime } from "@/lib/utils";

export function ScheduledCleanupPage() {
  const { data: schedules, isLoading } = useScheduledCleanups();
  const { data: templates } = useTemplates();
  const toggle = useToggleSchedule();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Scheduled Cleanup</h1>
        <p className="text-sm text-text-dim">Automate recurring cleanups powered by EventBridge.</p>
      </div>

      {isLoading && <p className="text-sm text-text-dim">Loading schedules…</p>}

      <div className="space-y-3">
        {schedules?.map((s) => {
          const template = templates?.find((t) => t.id === s.templateId);
          return (
            <Card key={s.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">{s.name}</span>
                    <Badge variant={s.enabled ? "success" : "default"}>
                      {s.enabled ? "Enabled" : "Paused"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-text-dim">{s.scheduleDescription}</p>
                  <p className="mt-0.5 text-xs text-text-faint">
                    {template ? `Template: ${template.name} · ` : ""}Next run {formatDateTime(s.nextRunAt)}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => toggle.mutate(s.id)}>
                {s.enabled ? "Pause" : "Resume"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
