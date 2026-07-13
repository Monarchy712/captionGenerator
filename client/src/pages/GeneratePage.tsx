import { useState } from "react";
import { ChevronDown, Eye, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { CAPTION_STYLES, type CaptionStyle, type GeneratedCaption } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CaptionCard } from "@/components/captions/CaptionCard";
import { useGenerate, useIterate, usePreviewPrompt } from "@/hooks/useCaptionApi";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FormValues {
  transcript: string;
  speaker: string;
  style: CaptionStyle;
}

export function GeneratePage() {
  const generate = useGenerate();
  const iterate = useIterate();
  const preview = usePreviewPrompt();

  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iterationNotes, setIterationNotes] = useState("");

  const { register, handleSubmit, control, watch, formState } = useForm<FormValues>({
    defaultValues: {
      transcript: "",
      speaker: "",
      style: "Viral",
    },
  });

  const values = watch();
  const busy = generate.isPending || iterate.isPending;

  async function onGenerate(data: FormValues) {
    setError(null);
    try {
      const result = await generate.mutateAsync({
        transcript: data.transcript,
        speaker: data.speaker.trim(),
        style: data.style,
        count: 5,
      });
      setCaptions(result.captions);
      setIterationNotes("");
      if (result.promptPreview) setPromptPreview(result.promptPreview);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Generation failed");
    }
  }

  async function onIterate() {
    setError(null);
    if (!iterationNotes.trim()) {
      setError("Type an iteration note first — e.g. make hooks shorter, add more tension");
      return;
    }
    try {
      const result = await iterate.mutateAsync({
        transcript: values.transcript,
        speaker: values.speaker.trim(),
        style: values.style,
        currentCaptions: captions.map((c) => c.finalText),
        iterationNotes: iterationNotes.trim(),
        count: captions.length || 5,
      });
      setCaptions(result.captions);
      if (result.promptPreview) setPromptPreview(result.promptPreview);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Iteration failed");
    }
  }

  async function onPreview() {
    setError(null);
    try {
      const result = await preview.mutateAsync({
        transcript: values.transcript,
        speaker: values.speaker.trim(),
        style: values.style,
        count: 5,
        previewOnly: true,
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

  const canSubmit = !!values.transcript?.trim() && !!values.speaker?.trim();

  return (
    <div className="space-y-8">
      <div className="space-y-2 animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Generate</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Studio
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Paste a transcript and the guest&apos;s name. The backend assembles rules and examples into
          the prompt — then returns five captions that can mention the speaker.
        </p>
      </div>

      <form onSubmit={handleSubmit(onGenerate)} className="space-y-6">
        <Card className="animate-fade-up" style={{ animationDelay: "40ms" }}>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Paste the clip transcript. Do not craft prompts here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register("transcript", { required: true })}
              rows={10}
              placeholder="Paste transcript…"
              className="min-h-[220px]"
            />
            {formState.errors.transcript && (
              <p className="mt-2 text-sm text-destructive">Transcript is required</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Speaker / guest</CardTitle>
              <CardDescription>Type the guest&apos;s name — used for attribution in captions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                {...register("speaker", { required: true })}
                placeholder="e.g. Vitalik, Anatoly, Jane Doe"
                autoComplete="off"
              />
              {formState.errors.speaker && (
                <p className="mt-2 text-sm text-destructive">Speaker name is required</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Style</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="style"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPTION_STYLES.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <Button type="submit" size="lg" disabled={busy || !canSubmit}>
            {generate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate captions
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={preview.isPending || !canSubmit}
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
      </form>

      {(promptPreview || previewOpen) && (
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <Card>
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between text-left">
                  <div>
                    <CardTitle className="text-base">Assembled prompt</CardTitle>
                    <CardDescription>
                      Exact prompt the backend sends to the model — built from rules and examples.
                    </CardDescription>
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 transition-transform", previewOpen && "rotate-180")}
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
        <section className="space-y-4">
          <div>
            <Label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Generated captions
            </Label>
            <h2 className="font-display mt-1 text-2xl font-semibold">Pick, edit, and train</h2>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Iterate</CardTitle>
              <CardDescription>
                Tell the model what to change. It keeps the current captions as context and rewrites them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={iterationNotes}
                onChange={(e) => setIterationNotes(e.target.value)}
                rows={3}
                placeholder='e.g. "Make hooks sharper and under 12 words" · "Lead with the $500B stat" · "Less hype, more tension"'
              />
              <Button
                type="button"
                onClick={onIterate}
                disabled={busy || !iterationNotes.trim() || !canSubmit}
              >
                {iterate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iterating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Iterate captions
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
