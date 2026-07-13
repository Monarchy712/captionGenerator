import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { OutputKind } from "@caption-studio/shared";
import { OUTPUT_KIND_LABELS, OUTPUT_KINDS } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useReplaceRules, useRules } from "@/hooks/useCaptionApi";

function RuleKindEditor({ kind }: { kind: OutputKind }) {
  const { data, isLoading, error } = useRules(kind);
  const replace = useReplaceRules();
  const [lines, setLines] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setLines(data.map((r) => r.content));
  }, [data]);

  async function save() {
    await replace.mutateAsync({
      outputKind: kind,
      rules: lines
        .filter((l) => l.trim())
        .map((content, i) => ({ content: content.trim(), sortOrder: i, isActive: true })),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const label = OUTPUT_KIND_LABELS[kind];

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={`Failed to load ${label} rules`} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label} rules</CardTitle>
        <CardDescription>
          Hard constraints injected only when generating {label.toLowerCase()}. Edit these
          independently of the other generators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="mt-2.5 w-6 shrink-0 font-mono text-xs text-muted-foreground">
              {i + 1}.
            </span>
            <Input
              value={line}
              onChange={(e) => {
                const next = [...lines];
                next[i] = e.target.value;
                setLines(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, ""])}>
            <Plus className="h-3.5 w-3.5" />
            Add rule
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={replace.isPending}>
            {replace.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saved ? "Saved" : `Save ${label} rules`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RulesPanel() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Each generator has its own rule set. X Captions, Shorts Title, and Shorts Caption do not
        share rules — edit them separately below.
      </p>
      {OUTPUT_KINDS.map((kind) => (
        <RuleKindEditor key={kind} kind={kind} />
      ))}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}
