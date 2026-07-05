import { LayoutTemplate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTemplates } from "@/hooks/queries";

export function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Cleanup Templates</h1>
        <p className="text-sm text-text-dim">Reusable filter presets for common cleanup scenarios.</p>
      </div>

      {isLoading && <p className="text-sm text-text-dim">Loading templates…</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {templates?.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-medium text-text">{t.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-text-dim">{t.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(t.filters).map(([k, v]) => (
                <span key={k} className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-text-faint">
                  {k}={v}
                </span>
              ))}
            </div>
            <Button size="sm" variant="secondary" className="mt-4" onClick={() => navigate("/app/explorer")}>
              Use template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
