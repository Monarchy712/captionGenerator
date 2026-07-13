import { useState } from "react";
import { ChevronDown, Eye, Loader2, Wand2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { CAPTION_STYLES, type CaptionStyle, type GeneratedCaption } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CaptionCard } from "@/components/captions/CaptionCard";
import { useGenerate, usePreviewPrompt, useSpeakers } from "@/hooks/useCaptionApi";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FormValues {
  transcript: string;
  speaker: string;
  style: CaptionStyle;
}

export function GeneratePage() {
  const speakersQuery = useSpeakers();
  const generate = useGenerate();
  const preview = usePreviewPrompt();

  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, formState } = useForm<FormValues>({
    defaultValues: {
      transcript: "",
      speaker: "Rhea",
      style: "Viral",
    },
  });

  const values = watch();
  const speakers = speakersQuery.data ?? [];

  async function onGenerate(data: FormValues) {
    setError(null);
    try {
      const result = await generate.mutateAsync({
        transcript: data.transcript,
        speaker: data.speaker,
        style: data.style,
        count: 5,
      });
      setCaptions(result.captions);
      if (result.promptPreview) setPromptPreview(result.promptPreview);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Generation failed");
    }
  }

  async function onPreview() {
    setError(null);
    try {
      const result = await preview.mutateAsync({
        transcript: values.transcript,
        speaker: values.speaker,
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

  return (
    <div className="space-y-8">
      <div className="space-y-2 animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Generate</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Studio
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Paste a transcript. The backend assembles rules, examples, and speaker context into the
          prompt — then returns five captions ready for feedback.
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
              <CardTitle className="text-base">Speaker</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="speaker"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker" />
                    </SelectTrigger>
                    <SelectContent>
                      {(speakers.length
                        ? speakers.map((s) => s.name)
                        : ["Rhea", "Arjun", "Scott", "Anatoly", "Other"]
                      ).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
          <Button type="submit" size="lg" disabled={generate.isPending || !values.transcript?.trim()}>
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
            disabled={preview.isPending || !values.transcript?.trim()}
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
                      Exact prompt the backend sends to Claude — built from rules, examples, and profiles.
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
