import { useState } from "react";
import { ChevronDown, Eye, Loader2 } from "lucide-react";
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

export function GeneratePage() {
  const preview = usePreviewPrompt();

  const [transcript, setTranscript] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [style, setStyle] = useState<CaptionStyle>("Viral");
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Generate</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Caption Studio
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          One transcript feeds three outputs: X captions, Shorts titles, and Shorts captions.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Shared across all three generators below.</CardDescription>
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
            disabled={preview.isPending}
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
        transcript={transcript}
        speaker={speaker}
        style={style}
        description="Full X / social captions using rules, principles, and good/bad examples."
      />

      <OutputSection
        kind="shorts_title"
        transcript={transcript}
        speaker={speaker}
        style={style}
        description="YouTube Shorts titles. Own rule set in Admin — no good/bad examples."
      />

      <OutputSection
        kind="shorts_caption"
        transcript={transcript}
        speaker={speaker}
        style={style}
        description="YouTube Shorts captions. Own rule set in Admin — no good/bad examples."
      />
    </div>
  );
}
