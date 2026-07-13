import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateGoodExample,
  useDeleteGoodExample,
  useGoodExamples,
} from "@/hooks/useCaptionApi";
import { ErrorBox, Loading } from "./RulesPanel";

export function GoodExamplesPanel() {
  const { data, isLoading, error } = useGoodExamples();
  const create = useCreateGoodExample();
  const remove = useDeleteGoodExample();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    transcript: "",
    caption: "",
    category: "general",
    tags: "",
    speaker: "",
    style: "Viral",
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message="Failed to load good examples" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Good examples</CardTitle>
            <CardDescription>
              Winning transcript → caption pairs. Guest name is optional metadata only — examples
              are matched by style, not by speaker.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </CardHeader>
        {open && (
          <CardContent className="space-y-3 border-t border-border pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Style">
                <Input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
              </Field>
              <Field label="Category">
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
              <Field label="Tags (comma-separated)">
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </Field>
              <Field label="Guest name (optional)">
                <Input
                  value={form.speaker}
                  onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                  placeholder="Optional — not used for matching"
                />
              </Field>
            </div>
            <Field label="Transcript">
              <Textarea
                rows={4}
                value={form.transcript}
                onChange={(e) => setForm({ ...form, transcript: e.target.value })}
              />
            </Field>
            <Field label="Caption">
              <Textarea
                rows={6}
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
            </Field>
            <Button
              disabled={create.isPending || !form.transcript || !form.caption}
              onClick={async () => {
                await create.mutateAsync({
                  ...form,
                  tags: form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
                setForm({ transcript: "", caption: "", category: "general", tags: "", speaker: "", style: "Viral" });
                setOpen(false);
              }}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create example"}
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-3">
        {(data ?? []).map((ex) => (
          <Card key={ex.id}>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {ex.style && <span className="rounded bg-secondary px-2 py-0.5">{ex.style}</span>}
                  <span className="rounded bg-secondary px-2 py-0.5">{ex.category}</span>
                  {ex.speaker ? (
                    <span className="rounded bg-secondary px-2 py-0.5 normal-case">{ex.speaker}</span>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(ex.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Transcript</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{ex.transcript}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Caption</p>
                <p className="whitespace-pre-wrap text-sm">{ex.caption}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
