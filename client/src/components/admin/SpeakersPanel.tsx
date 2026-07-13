import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminSpeakers,
  useCreateSpeaker,
  useDeleteSpeaker,
  useUpdateSpeaker,
} from "@/hooks/useCaptionApi";
import { ErrorBox, Loading } from "./RulesPanel";

const empty = {
  name: "",
  tone: "",
  founderStyle: "",
  technicalDepth: "",
  audience: "",
  writingStyle: "",
  vocabulary: "",
  notes: "",
};

export function SpeakersPanel() {
  const { data, isLoading, error } = useAdminSpeakers();
  const create = useCreateSpeaker();
  const update = useUpdateSpeaker();
  const remove = useDeleteSpeaker();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message="Failed to load speakers" />;

  function field(key: keyof typeof empty, label: string, multiline = false) {
    const Comp = multiline ? Textarea : Input;
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Comp
          value={form[key] ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm({ ...form, [key]: e.target.value })
          }
          rows={multiline ? 3 : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Speaker profiles</CardTitle>
            <CardDescription>Voice, audience, and vocabulary injected into prompts.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCreating(!creating);
              setForm(empty);
              setEditingId(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </CardHeader>
        {creating && (
          <CardContent className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
            {field("name", "Name")}
            {field("tone", "Tone")}
            {field("founderStyle", "Founder style")}
            {field("technicalDepth", "Technical depth")}
            {field("audience", "Audience")}
            {field("writingStyle", "Writing style")}
            <div className="sm:col-span-2">{field("vocabulary", "Vocabulary", true)}</div>
            <div className="sm:col-span-2">{field("notes", "Notes", true)}</div>
            <Button
              className="sm:col-span-2"
              disabled={create.isPending || !form.name || !form.tone}
              onClick={async () => {
                await create.mutateAsync(form);
                setCreating(false);
                setForm(empty);
              }}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create speaker"}
            </Button>
          </CardContent>
        )}
      </Card>

      {(data ?? []).map((s) => (
        <Card key={s.id}>
          <CardContent className="space-y-3 pt-5">
            {editingId === s.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {field("name", "Name")}
                {field("tone", "Tone")}
                {field("founderStyle", "Founder style")}
                {field("technicalDepth", "Technical depth")}
                {field("audience", "Audience")}
                {field("writingStyle", "Writing style")}
                <div className="sm:col-span-2">{field("vocabulary", "Vocabulary", true)}</div>
                <div className="sm:col-span-2">{field("notes", "Notes", true)}</div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button
                    size="sm"
                    disabled={update.isPending}
                    onClick={async () => {
                      await update.mutateAsync({ id: s.id, ...form });
                      setEditingId(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-xl font-semibold">{s.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(s.id);
                        setCreating(false);
                        setForm({
                          name: s.name,
                          tone: s.tone,
                          founderStyle: s.founderStyle,
                          technicalDepth: s.technicalDepth,
                          audience: s.audience,
                          writingStyle: s.writingStyle,
                          vocabulary: s.vocabulary,
                          notes: s.notes ?? "",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <Item label="Tone" value={s.tone} />
                  <Item label="Founder style" value={s.founderStyle} />
                  <Item label="Technical depth" value={s.technicalDepth} />
                  <Item label="Audience" value={s.audience} />
                  <Item label="Writing style" value={s.writingStyle} />
                  <Item label="Vocabulary" value={s.vocabulary} />
                  {s.notes && <Item label="Notes" value={s.notes} />}
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
