import { useEffect, useState } from "react";
import { Lock, LogOut, Loader2 } from "lucide-react";
import type { OutputKind } from "@caption-studio/shared";
import { OUTPUT_KIND_LABELS, OUTPUT_KINDS } from "@caption-studio/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminToken, setAdminToken } from "@/lib/api";
import { useLogin } from "@/hooks/useCaptionApi";
import { RulesPanel } from "@/components/admin/RulesPanel";
import { GoodExamplesPanel } from "@/components/admin/GoodExamplesPanel";
import { BadExamplesPanel } from "@/components/admin/BadExamplesPanel";
import { PrinciplesPanel } from "@/components/admin/PrinciplesPanel";
import { PromptTemplatePanel } from "@/components/admin/PromptTemplatePanel";
import { cn } from "@/lib/utils";

export function AdminPage() {
  const [authed, setAuthed] = useState(!!getAdminToken());
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outputKind, setOutputKind] = useState<OutputKind>("x_captions");
  const login = useLogin();

  useEffect(() => {
    setAuthed(!!getAdminToken());
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await login.mutateAsync(password);
      setAdminToken(result.token);
      setAuthed(true);
    } catch {
      setError("Invalid password");
    }
  }

  function logout() {
    setAdminToken(null);
    setAuthed(false);
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Admin access</CardTitle>
            <CardDescription>
              Manage rules, examples, writing principles, and prompt templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={login.isPending || !password}>
                {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Admin</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Knowledge base</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">
            Pick an output type, then edit its rules, examples, principles, and template.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-3.5 w-3.5" />
          Lock
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {OUTPUT_KINDS.map((kind) => (
          <Button
            key={kind}
            type="button"
            variant={outputKind === kind ? "default" : "outline"}
            size="sm"
            onClick={() => setOutputKind(kind)}
            className={cn(outputKind === kind && "ring-1 ring-primary/40")}
          >
            {OUTPUT_KIND_LABELS[kind]}
          </Button>
        ))}
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Editing · {OUTPUT_KIND_LABELS[outputKind]}
      </p>

      <Tabs defaultValue="rules" key={outputKind}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="good">Good examples</TabsTrigger>
          <TabsTrigger value="bad">Bad examples</TabsTrigger>
          <TabsTrigger value="principles">Principles</TabsTrigger>
          <TabsTrigger value="prompt">Prompt template</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <RulesPanel outputKind={outputKind} />
        </TabsContent>
        <TabsContent value="good">
          <GoodExamplesPanel outputKind={outputKind} />
        </TabsContent>
        <TabsContent value="bad">
          <BadExamplesPanel outputKind={outputKind} />
        </TabsContent>
        <TabsContent value="principles">
          <PrinciplesPanel outputKind={outputKind} />
        </TabsContent>
        <TabsContent value="prompt">
          <PromptTemplatePanel outputKind={outputKind} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
