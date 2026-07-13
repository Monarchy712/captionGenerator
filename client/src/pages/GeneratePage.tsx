import { useState } from "react";
import { ChevronDown, Eye, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { CAPTION_STYLES, type CaptionStyle } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OutputSection } from "@/components/generate/OutputSection";
import { usePreviewPrompt } from "@/hooks/useCaptionApi";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FormValues {
  transcript: string;
  speaker: string;
  style: CaptionStyle;
}

export function GeneratePage() {
  const preview = usePreviewPrompt();

  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, watch, formState } = useForm<FormValues>({
    defaultValues: {
      transcript: "",
      speaker: "",
      style: "Viral",
    },
  });

  const values = watch();
  const canSubmit = !!values.transcript?.trim() && !!values.speaker?.trim();

  async function onPreview() {
    setError(null);
    try {
      const result = await preview.mutateAsync({
        transcript: values.transcript,
        speaker: values.speaker.trim(),
        style: values.style,
        count: 5,
        previewOnly: true,
        outputKind: "x_captions",
      });
      setPromptPreview(result.promptPreview);
      setPreviewOpen(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Preview failed");
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Generate</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Studio
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          One transcript feeds three outputs: X captions, Shorts titles, and Shorts captions.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="animate-fade-up" style={{ animationDelay: "40ms" }}>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Shared across all three generators below.</CardDescription>
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
              <CardDescription>Used for attribution.</CardDescription>
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

        <div className="flex flex-wrap items-center gap-3">
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
            Prompt preview (X Captions)
          </Button>
        </div>
      </div>

      {(promptPreview || previewOpen) && (
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <Card>
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between text-left">
                  <div>
                    <CardTitle className="text-base">Assembled prompt</CardTitle>
                    <CardDescription>X Captions prompt preview.</CardDescription>
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

      <OutputSection
        kind="x_captions"
        transcript={values.transcript}
        speaker={values.speaker}
        style={values.style}
        canSubmit={canSubmit}
        description="Full X / social captions using rules, principles, and good/bad examples."
      />

      <OutputSection
        kind="shorts_title"
        transcript={values.transcript}
        speaker={values.speaker}
        style={values.style}
        canSubmit={canSubmit}
        description="YouTube Shorts titles. Same template, principles, and rules — no examples, no word-count limits."
      />

      <OutputSection
        kind="shorts_caption"
        transcript={values.transcript}
        speaker={values.speaker}
        style={values.style}
        canSubmit={canSubmit}
        description="YouTube Shorts captions. Same template, principles, and rules — no examples, no word-count limits."
      />
    </div>
  );
}
