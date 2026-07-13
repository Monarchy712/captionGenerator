import { useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  CheckCheck,
} from "lucide-react";
import type { GeneratedCaption } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFeedback } from "@/hooks/useCaptionApi";
import { cn } from "@/lib/utils";

interface CaptionCardProps {
  caption: GeneratedCaption;
  index: number;
  onUpdate: (caption: GeneratedCaption) => void;
}

export function CaptionCard({ caption, index, onUpdate }: CaptionCardProps) {
  const feedback = useFeedback();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(caption.finalText);

  const text = caption.finalText;

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function send(type: "like" | "dislike" | "used" | "edit", editedText?: string) {
    const result = await feedback.mutateAsync({
      captionId: caption.id,
      type,
      editedText,
    });
    onUpdate(result.caption);
    if (type === "like") {
      setLiked(true);
      setDisliked(false);
    }
    if (type === "dislike") {
      setDisliked(true);
      setLiked(false);
    }
  }

  return (
    <>
      <Card
        className="animate-fade-up group relative overflow-hidden"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Caption {index + 1}
            {caption.version > 1 && (
              <span className="ml-2 text-primary">v{caption.version}</span>
            )}
            {caption.isUsed && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                <CheckCheck className="h-3 w-3" /> Used
              </span>
            )}
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">{text}</p>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <Button variant="ghost" size="sm" onClick={copy} title="Copy">
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(liked && "text-primary")}
              onClick={() => send("like")}
              disabled={feedback.isPending}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(disliked && "text-destructive")}
              onClick={() => send("dislike")}
              disabled={feedback.isPending}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => send("used")}
              disabled={feedback.isPending || caption.isUsed}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark used
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(text);
                setEditOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit caption</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Edits create a new version — the original AI output is preserved.
          </p>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!draft.trim() || feedback.isPending}
              onClick={async () => {
                await send("edit", draft.trim());
                setEditOpen(false);
              }}
            >
              Save version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
