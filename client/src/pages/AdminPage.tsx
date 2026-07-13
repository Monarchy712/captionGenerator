import { useEffect, useState } from "react";
import { Lock, LogOut, Loader2 } from "lucide-react";
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
import { SpeakersPanel } from "@/components/admin/SpeakersPanel";
import { PromptTemplatePanel } from "@/components/admin/PromptTemplatePanel";

export function AdminPage() {
  const [authed, setAuthed] = useState(!!getAdminToken());
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      <div className="mx-auto max-w-md animate-fade-up">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Admin access</CardTitle>
            <CardDescription>
              Manage rules, examples, speaker profiles, and prompt templates.
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
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Admin</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Knowledge base</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">
            This is the operating system behind every caption — rules, examples, voice, and templates.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-3.5 w-3.5" />
          Lock
        </Button>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="good">Good examples</TabsTrigger>
          <TabsTrigger value="bad">Bad examples</TabsTrigger>
          <TabsTrigger value="principles">Principles</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="prompt">Prompt template</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <RulesPanel />
        </TabsContent>
        <TabsContent value="good">
          <GoodExamplesPanel />
        </TabsContent>
        <TabsContent value="bad">
          <BadExamplesPanel />
        </TabsContent>
        <TabsContent value="principles">
          <PrinciplesPanel />
        </TabsContent>
        <TabsContent value="speakers">
          <SpeakersPanel />
        </TabsContent>
        <TabsContent value="prompt">
          <PromptTemplatePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
