import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Loader2, XCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  useAccounts,
  useConnectAccount,
  useInvalidateScanResults,
  useScanAccount,
  useValidateAccount,
} from "@/hooks/queries";
import { formatDateTime } from "@/lib/utils";

const statusIcon = {
  connected: <CheckCircle2 className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  scanning: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  error: <XCircle className="h-3.5 w-3.5" />,
};

const statusVariant = {
  connected: "success" as const,
  pending: "warning" as const,
  scanning: "info" as const,
  error: "danger" as const,
};

export function AccountConnectPage() {
  const { data: accounts, isLoading } = useAccounts();
  const connect = useConnectAccount();
  const validate = useValidateAccount();
  const scan = useScanAccount();
  const invalidateScanResults = useInvalidateScanResults();

  const wasScanning = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!accounts) return;
    let finished = false;
    for (const a of accounts) {
      if (a.status === "scanning") {
        wasScanning.current.add(a.id);
      } else if (wasScanning.current.has(a.id)) {
        wasScanning.current.delete(a.id);
        finished = true;
      }
    }
    if (finished) invalidateScanResults();
  }, [accounts, invalidateScanResults]);

  const [form, setForm] = useState({
    name: "",
    awsAccountId: "",
    roleArn: "",
    externalId: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    connect.mutate(
      { ...form, regions: ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"] },
      { onSuccess: () => setForm({ name: "", awsAccountId: "", roleArn: "", externalId: "" }) }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text">AWS Accounts</h1>
        <p className="text-sm text-text-dim">
          Connect an account by assuming a cross-account IAM role — no long-lived access keys.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-text-dim">Loading…</p>}
            {accounts?.map((a) => {
              const scanning = a.status === "scanning";
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{a.name}</span>
                      <Badge variant={statusVariant[a.status]}>
                        {statusIcon[a.status]}
                        {a.status}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-text-faint">{a.awsAccountId}</p>
                    <p className="mt-1 text-xs text-text-faint">
                      Last scanned {formatDateTime(a.lastScanAt)} · {a.regions.length} regions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => validate.mutate(a.id)}
                      disabled={scanning}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Validate
                    </Button>
                    <Button size="sm" onClick={() => scan.mutate(a.id)} disabled={scanning}>
                      {scanning ? "Scanning…" : "Scan now"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connect New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submit}>
              <Input
                placeholder="Account name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="AWS Account ID"
                value={form.awsAccountId}
                onChange={(e) => setForm({ ...form, awsAccountId: e.target.value })}
                required
              />
              <Input
                placeholder="Role ARN (arn:aws:iam::...:role/CloudCleanReadOnly)"
                value={form.roleArn}
                onChange={(e) => setForm({ ...form, roleArn: e.target.value })}
                required
              />
              <Input
                placeholder="External ID"
                value={form.externalId}
                onChange={(e) => setForm({ ...form, externalId: e.target.value })}
                required
              />
              <Button type="submit" className="w-full" disabled={connect.isPending}>
                {connect.isPending ? "Connecting…" : "Connect account"}
              </Button>
            </form>
            <p className="mt-3 text-xs leading-relaxed text-text-faint">
              Deploy CloudClean's CloudFormation template in your account first — it creates a
              least-privilege role trusting our platform account with this External ID.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
