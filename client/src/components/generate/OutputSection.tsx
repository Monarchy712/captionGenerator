import { useState } from "react";
import { Loader2, RefreshCw, Wand2 } from "lucide-react";
import type { CaptionStyle, GeneratedCaption, OutputKind } from "@caption-studio/shared";
import { OUTPUT_KIND_LABELS } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CaptionCard } from "@/components/captions/CaptionCard";
import { useGenerate, useIterate } from "@/hooks/useCaptionApi";
import { ApiClientError } from "@/lib/api";

interface OutputSectionProps {
  kind: OutputKind;
  transcript: string;
  speaker: string;
  style: CaptionStyle;
  description: string;
}

export function OutputSection({
  kind,
  transcript,
  speaker,
  style,
  description,
}: OutputSectionProps) {
  const generate = useGenerate();
  const iterate = useIterate();
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [iterationNotes, setIterationNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = generate.isPending || iterate.isPending;
  const label = OUTPUT_KIND_LABELS[kind];

  async function onGenerate() {
    setError(null);
    if (!transcript.trim() || !speaker.trim()) {
      setError("Paste a transcript and enter a speaker name first.");
      return;
    }
    try {
      const result = await generate.mutateAsync({
        transcript,
        speaker: speaker.trim(),
        style,
        count: 5,
        outputKind: kind,
      });
      setCaptions(result.captions);
      setIterationNotes("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Generation failed");
    }
  }

  async function onIterate() {
    setError(null);
    if (!transcript.trim() || !speaker.trim()) {
      setError("Paste a transcript and enter a speaker name first.");
      return;
    }
    if (!iterationNotes.trim()) {
      setError("Type an iteration note first");
      return;
    }
    try {
      const result = await iterate.mutateAsync({
        transcript,
        speaker: speaker.trim(),
        style,
        currentCaptions: captions.map((c) => c.finalText),
        iterationNotes: iterationNotes.trim(),
        count: captions.length || 5,
        outputKind: kind,
      });
      setCaptions(result.captions);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Iteration failed");
    }
  }

  function updateCaption(updated: GeneratedCaption) {
    setCaptions((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <section className="space-y-4 border-t border-border/60 pt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold">{label}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={onGenerate} disabled={busy}>
          {generate.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate {label.toLowerCase()}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {captions.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Iterate</CardTitle>
              <CardDescription>
                Refine these {label.toLowerCase()} with notes — model keeps them as context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={iterationNotes}
                onChange={(e) => setIterationNotes(e.target.value)}
                rows={3}
                placeholder='e.g. "Make them sharper" · "Lead with the number" · "Less hype"'
              />
              <Button type="button" onClick={onIterate} disabled={busy}>
                {iterate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iterating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Iterate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {captions.map((caption, i) => (
              <CaptionCard key={caption.id} caption={caption} index={i} onUpdate={updateCaption} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
