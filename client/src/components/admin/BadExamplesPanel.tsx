import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { OutputKind } from "@caption-studio/shared";
import { OUTPUT_KIND_LABELS } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useBadExamples,
  useCreateBadExample,
  useDeleteBadExample,
} from "@/hooks/useCaptionApi";
import { ErrorBox, Loading } from "./RulesPanel";

export function BadExamplesPanel({ outputKind }: { outputKind: OutputKind }) {
  const { data, isLoading, error } = useBadExamples(outputKind);
  const create = useCreateBadExample();
  const remove = useDeleteBadExample();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ caption: "", reason: "" });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message="Failed to load bad examples" />;

  const label = OUTPUT_KIND_LABELS[outputKind];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{label} — bad examples</CardTitle>
            <CardDescription>Anti-patterns for this output type only — with reasons.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </CardHeader>
        {open && (
          <CardContent className="space-y-3 border-t border-border pt-5">
            <div className="space-y-1.5">
              <Label>Bad caption</Label>
              <Textarea
                rows={3}
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Why it&apos;s bad</Label>
              <Textarea
                rows={2}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <Button
              disabled={create.isPending || !form.caption || !form.reason}
              onClick={async () => {
                await create.mutateAsync({ ...form, outputKind });
                setForm({ caption: "", reason: "" });
                setOpen(false);
              }}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-3">
        {(data ?? []).map((ex) => (
          <Card key={ex.id}>
            <CardContent className="flex items-start justify-between gap-3 pt-5">
              <div className="space-y-2">
                <p className="whitespace-pre-wrap text-sm line-through decoration-destructive/50 opacity-80">
                  {ex.caption}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="text-destructive/80">Why: </span>
                  {ex.reason}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(ex.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {(data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No bad examples for {label} yet.</p>
        )}
      </div>
    </div>
  );
}
