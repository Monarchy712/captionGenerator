import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreatePrinciple,
  useDeletePrinciple,
  usePrinciples,
  useUpdatePrinciple,
} from "@/hooks/useCaptionApi";
import { ErrorBox, Loading } from "./RulesPanel";

export function PrinciplesPanel() {
  const { data, isLoading, error } = usePrinciples();
  const create = useCreatePrinciple();
  const update = useUpdatePrinciple();
  const remove = useDeletePrinciple();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message="Failed to load principles" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Writing principles</CardTitle>
            <CardDescription>Markdown-friendly guidance for caption craft.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCreating(!creating)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </CardHeader>
        {creating && (
          <CardContent className="space-y-3 border-t border-border pt-5">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content (markdown)</Label>
              <Textarea
                rows={5}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
            <Button
              disabled={create.isPending || !draft.title || !draft.content}
              onClick={async () => {
                await create.mutateAsync(draft);
                setDraft({ title: "", content: "" });
                setCreating(false);
              }}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </CardContent>
        )}
      </Card>

      {(data ?? []).map((p) => (
        <Card key={p.id}>
          <CardContent className="space-y-3 pt-5">
            {editingId === p.id ? (
              <>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
                <Textarea
                  rows={6}
                  className="font-mono text-xs"
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={update.isPending}
                    onClick={async () => {
                      await update.mutateAsync({ id: p.id, ...draft });
                      setEditingId(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(p.id);
                        setDraft({ title: p.title, content: p.content });
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                  {p.content}
                </pre>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
