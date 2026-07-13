import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BadExample,
  CaptionStyle,
  GenerateRequest,
  GenerateResponse,
  GoodExample,
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

export function useFeedback() {
  return useMutation({
    mutationFn: (body: FeedbackRequest) =>
      api.post<{ caption: GeneratedCaption }>("/feedback", body),
  });
}

export function useRules() {
  return useQuery({
    queryKey: ["rules"],
    queryFn: () => api.get<Rule[]>("/rules", true),
  });
}

export function useReplaceRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: { content: string; sortOrder: number; isActive?: boolean }[]) =>
      api.put<Rule[]>("/rules", { rules }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules"] }),
  });
}

export function useGoodExamples() {
  return useQuery({
    queryKey: ["examples"],
    queryFn: () => api.get<GoodExample[]>("/examples", true),
  });
}

export function useCreateGoodExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<GoodExample>) => api.post<GoodExample>("/examples", body, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["examples"] }),
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

export function useBadExamples() {
  return useQuery({
    queryKey: ["bad-examples"],
    queryFn: () => api.get<BadExample[]>("/bad-examples", true),
  });
}

export function useCreateBadExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<BadExample>) => api.post<BadExample>("/bad-examples", body, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bad-examples"] }),
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

export function usePrinciples() {
  return useQuery({
    queryKey: ["principles"],
    queryFn: () => api.get<WritingPrinciple[]>("/principles", true),
  });
}

export function useCreatePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<WritingPrinciple>) =>
      api.post<WritingPrinciple>("/principles", body, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["principles"] }),
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

export function usePromptTemplate() {
  return useQuery({
    queryKey: ["prompt-template"],
    queryFn: () =>
      api.get<PromptTemplate & { versions: { id: string; version: number; content: string; createdAt: string }[] }>(
        "/prompt-template",
        true
      ),
  });
}

export function useUpdatePromptTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.put("/prompt-template", { content }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompt-template"] }),
  });
}

export function useRevertPromptTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => api.post("/prompt-template/revert", { version }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompt-template"] }),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (password: string) => api.post<{ ok: boolean; token: string }>("/auth/login", { password }),
  });
}

export type { CaptionStyle, GeneratedCaption };
