import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  usePromptTemplate,
  useRevertPromptTemplate,
  useUpdatePromptTemplate,
} from "@/hooks/useCaptionApi";
import { ErrorBox, Loading } from "./RulesPanel";

export function PromptTemplatePanel() {
  const { data, isLoading, error } = usePromptTemplate();
  const update = useUpdatePromptTemplate();
  const revert = useRevertPromptTemplate();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setContent(data.content);
  }, [data]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message="Failed to load prompt template" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Prompt template</CardTitle>
          <CardDescription>
            Placeholders:{" "}
            <code className="text-primary">
              {"{{rules}} {{principles}} {{speaker_profile}} {{good_examples}} {{bad_examples}} {{transcript}} {{speaker}} {{style}} {{count}}"}
            </code>
            . Saving creates a new version — never overwrites history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Active version <span className="font-mono text-primary">v{data?.version}</span>
            </span>
            <span className="font-mono">{data?.name}</span>
          </div>
          <Textarea
            className="min-h-[360px] font-mono text-xs leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            disabled={update.isPending || !content.trim()}
            onClick={async () => {
              await update.mutateAsync(content);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saved ? "Saved as new version" : "Save new version"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version history
          </CardTitle>
          <CardDescription>Revert to any previous template snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.versions ?? []).map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="font-mono text-sm">
                  v{v.version}
                  {v.version === data?.version && (
                    <span className="ml-2 text-xs text-primary">current</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={revert.isPending || v.version === data?.version}
                onClick={() => revert.mutate(v.version)}
              >
                Revert
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
