import { useState } from "react";
import { Check, ChevronDown, Eye, Loader2, RefreshCw, Wand2 } from "lucide-react";
import {
  CAPTION_STYLES,
  OUTPUT_KIND_LABELS,
  OUTPUT_KINDS,
  type CaptionStyle,
  type GeneratedCaption,
  type OutputKind,
} from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CaptionCard } from "@/components/captions/CaptionCard";
import { useGenerate, useIterate, usePreviewPrompt } from "@/hooks/useCaptionApi";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function GeneratePage() {
  const generate = useGenerate();
  const iterate = useIterate();
  const preview = usePreviewPrompt();

  const [transcript, setTranscript] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [style, setStyle] = useState<CaptionStyle>("Viral");
  const [outputKind, setOutputKind] = useState<OutputKind>("x_captions");
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [iterationNotes, setIterationNotes] = useState("");
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = generate.isPending || iterate.isPending;
  const label = OUTPUT_KIND_LABELS[outputKind];

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
        outputKind,
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
        outputKind,
      });
      setCaptions(result.captions);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Iteration failed");
    }
  }

  async function onPreview() {
    setError(null);
    if (!transcript.trim() || !speaker.trim()) {
      setError("Paste a transcript and enter a speaker name first.");
      return;
    }
    try {
      const result = await preview.mutateAsync({
        transcript,
        speaker: speaker.trim(),
        style,
        count: 5,
        previewOnly: true,
        outputKind,
      });
      setPromptPreview(result.promptPreview);
      setPreviewOpen(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Preview failed");
    }
  }

  function updateCaption(updated: GeneratedCaption) {
    setCaptions((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Generate</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Studio
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Choose one output type, then generate from the shared transcript.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Used for whichever output type you select below.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              placeholder="Paste transcript…"
              className="min-h-[220px]"
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Speaker / guest</CardTitle>
              <CardDescription>Used for attribution.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Vitalik, Anatoly, Jane Doe"
                autoComplete="off"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Style</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={style} onValueChange={(v) => setStyle(v as CaptionStyle)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {CAPTION_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Output type</CardTitle>
            <CardDescription>Select one — only that knowledge base is used.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {OUTPUT_KINDS.map((kind) => {
                const selected = outputKind === kind;
                return (
                  <label
                    key={kind}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
                      selected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border hover:bg-accent/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setOutputKind(kind);
                        setCaptions([]);
                        setIterationNotes("");
                        setPromptPreview(null);
                      }}
                    />
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="text-sm font-medium">{OUTPUT_KIND_LABELS[kind]}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" size="lg" onClick={onGenerate} disabled={busy}>
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
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={preview.isPending}
                onClick={onPreview}
              >
                {preview.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Prompt preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {(promptPreview || previewOpen) && (
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <Card>
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between text-left">
                  <div>
                    <CardTitle className="text-base">Assembled prompt</CardTitle>
                    <CardDescription>{label} prompt preview.</CardDescription>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      previewOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-background/80 p-4 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {promptPreview}
                </pre>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {captions.length > 0 && (
        <section className="space-y-4 border-t border-border/60 pt-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Results
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold">{label}</h2>
          </div>

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
        </section>
      )}
    </div>
  );
}
