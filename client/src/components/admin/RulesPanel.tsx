import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useReplaceRules, useRules } from "@/hooks/useCaptionApi";

export function RulesPanel() {
  const { data, isLoading, error } = useRules();
  const replace = useReplaceRules();
  const [lines, setLines] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setLines(data.map((r) => r.content));
  }, [data]);

  async function save() {
    await replace.mutateAsync(
      lines.filter((l) => l.trim()).map((content, i) => ({ content: content.trim(), sortOrder: i, isActive: true }))
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message="Failed to load rules" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <CardDescription>
          Hard constraints injected into every generation prompt. Keep them short and absolute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="mt-2.5 w-6 shrink-0 font-mono text-xs text-muted-foreground">{i + 1}.</span>
            <Input
              value={line}
              onChange={(e) => {
                const next = [...lines];
                next[i] = e.target.value;
                setLines(next);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setLines([...lines, ""])}>
            <Plus className="h-3.5 w-3.5" />
            Add rule
          </Button>
          <Button size="sm" onClick={save} disabled={replace.isPending}>
            {replace.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saved ? "Saved" : "Save rules"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
