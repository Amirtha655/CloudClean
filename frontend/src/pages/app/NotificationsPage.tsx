import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/queries";
import type { NotificationSettings } from "@/types";

const toggles: { key: keyof NotificationSettings; label: string; desc: string }[] = [
  { key: "cleanupStarted", label: "Cleanup Started", desc: "Email when a cleanup run begins." },
  { key: "cleanupCompleted", label: "Cleanup Completed", desc: "Email with a summary when a run finishes." },
  { key: "cleanupFailed", label: "Cleanup Failed", desc: "Email immediately if any deletion fails." },
  { key: "scheduledReminder", label: "Scheduled Cleanup Reminder", desc: "Reminder before a scheduled run executes." },
];

export function NotificationsPage() {
  const { data } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  if (!settings) return <p className="text-sm text-text-dim">Loading notification settings…</p>;

  function toggle(key: keyof NotificationSettings) {
    setSettings((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Notifications</h1>
        <p className="text-sm text-text-dim">Choose which email alerts you want to receive.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Email</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            className="max-w-sm"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {toggles.map((t) => (
            <label
              key={t.key}
              className="flex cursor-pointer items-center justify-between rounded-md py-2.5"
            >
              <div>
                <p className="text-sm text-text">{t.label}</p>
                <p className="text-xs text-text-faint">{t.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings[t.key])}
                onChange={() => toggle(t.key)}
                className="h-4 w-4"
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button onClick={() => update.mutate(settings)} disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
