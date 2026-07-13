import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BadExample,
  CaptionStyle,
  GenerateRequest,
  GenerateResponse,
  IterateRequest,
  GoodExample,
  OutputKind,
  PromptTemplate,
  Rule,
  WritingPrinciple,
  FeedbackRequest,
  GeneratedCaption,
} from "@caption-studio/shared";
import { api } from "@/lib/api";

export function useGenerate() {
  return useMutation({
    mutationFn: (body: GenerateRequest) => api.post<GenerateResponse>("/generate", body),
  });
}

export function usePreviewPrompt() {
  return useMutation({
    mutationFn: (body: GenerateRequest) =>
      api.post<{ promptPreview: string }>("/generate/preview", body),
  });
}

export function useIterate() {
  return useMutation({
    mutationFn: (body: IterateRequest) => api.post<GenerateResponse>("/generate/iterate", body),
  });
}

export function useFeedback() {
  return useMutation({
    mutationFn: (body: FeedbackRequest) =>
      api.post<{ caption: GeneratedCaption }>("/feedback", body),
  });
}

export function useRules(outputKind?: OutputKind) {
  return useQuery({
    queryKey: ["rules", outputKind ?? "all"],
    queryFn: () =>
      api.get<Rule[]>(
        outputKind ? `/rules?outputKind=${encodeURIComponent(outputKind)}` : "/rules",
        true
      ),
  });
}

export function useReplaceRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      outputKind: OutputKind;
      rules: { content: string; sortOrder: number; isActive?: boolean }[];
    }) => api.put<Rule[]>("/rules", body, true),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rules", vars.outputKind] });
      qc.invalidateQueries({ queryKey: ["rules", "all"] });
    },
  });
}

export function useGoodExamples(outputKind: OutputKind) {
  return useQuery({
    queryKey: ["examples", outputKind],
    queryFn: () =>
      api.get<GoodExample[]>(`/examples?outputKind=${encodeURIComponent(outputKind)}`, true),
  });
}

export function useCreateGoodExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<GoodExample>) => api.post<GoodExample>("/examples", body, true),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["examples", vars.outputKind ?? "x_captions"] });
    },
  });
}

export function useUpdateGoodExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<GoodExample> & { id: string }) =>
      api.put<GoodExample>(`/examples/${id}`, body, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["examples"] }),
  });
}

export function useDeleteGoodExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/examples/${id}`, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["examples"] }),
  });
}

export function useBadExamples(outputKind: OutputKind) {
  return useQuery({
    queryKey: ["bad-examples", outputKind],
    queryFn: () =>
      api.get<BadExample[]>(`/bad-examples?outputKind=${encodeURIComponent(outputKind)}`, true),
  });
}

export function useCreateBadExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<BadExample>) => api.post<BadExample>("/bad-examples", body, true),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bad-examples", vars.outputKind ?? "x_captions"] });
    },
  });
}

export function useUpdateBadExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<BadExample> & { id: string }) =>
      api.put<BadExample>(`/bad-examples/${id}`, body, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bad-examples"] }),
  });
}

export function useDeleteBadExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bad-examples/${id}`, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bad-examples"] }),
  });
}

export function usePrinciples(outputKind: OutputKind) {
  return useQuery({
    queryKey: ["principles", outputKind],
    queryFn: () =>
      api.get<WritingPrinciple[]>(
        `/principles?outputKind=${encodeURIComponent(outputKind)}`,
        true
      ),
  });
}

export function useCreatePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<WritingPrinciple>) =>
      api.post<WritingPrinciple>("/principles", body, true),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["principles", vars.outputKind ?? "x_captions"] });
    },
  });
}

export function useUpdatePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<WritingPrinciple> & { id: string }) =>
      api.put<WritingPrinciple>(`/principles/${id}`, body, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["principles"] }),
  });
}

export function useDeletePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/principles/${id}`, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["principles"] }),
  });
}

export function usePromptTemplate(outputKind: OutputKind) {
  return useQuery({
    queryKey: ["prompt-template", outputKind],
    queryFn: () =>
      api.get<
        PromptTemplate & {
          versions: { id: string; version: number; content: string; createdAt: string }[];
        }
      >(`/prompt-template?outputKind=${encodeURIComponent(outputKind)}`, true),
  });
}

export function useUpdatePromptTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; outputKind: OutputKind }) =>
      api.put("/prompt-template", body, true),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["prompt-template", vars.outputKind] });
    },
  });
}

export function useRevertPromptTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { version: number; outputKind: OutputKind }) =>
      api.post("/prompt-template/revert", body, true),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["prompt-template", vars.outputKind] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (password: string) =>
      api.post<{ ok: boolean; token: string }>("/auth/login", { password }),
  });
}

export type { CaptionStyle, GeneratedCaption };
