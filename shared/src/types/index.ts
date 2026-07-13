/** Shared domain types used by both client and server. */

export type CaptionStyle =
  | "Viral"
  | "Educational"
  | "Technical"
  | "Founder"
  | "Contrarian"
  | "Funny";

export const CAPTION_STYLES: CaptionStyle[] = [
  "Viral",
  "Educational",
  "Technical",
  "Founder",
  "Contrarian",
  "Funny",
];

/** Which generator section produced this output. */
export type OutputKind = "x_captions" | "shorts_title" | "shorts_caption";

export const OUTPUT_KINDS: OutputKind[] = ["x_captions", "shorts_title", "shorts_caption"];

export const OUTPUT_KIND_LABELS: Record<OutputKind, string> = {
  x_captions: "X Captions",
  shorts_title: "Shorts Title",
  shorts_caption: "Shorts Caption",
};

export type FeedbackType = "like" | "dislike" | "edit" | "used";

export interface Rule {
  id: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingPrinciple {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateVersion {
  id: string;
  templateId: string;
  content: string;
  version: number;
  createdAt: string;
}

export interface GoodExample {
  id: string;
  transcript: string;
  caption: string;
  category: string;
  tags: string[];
  speaker?: string | null;
  style?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BadExample {
  id: string;
  caption: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  tone: string;
  founderStyle: string;
  technicalDepth: string;
  audience: string;
  writingStyle: string;
  vocabulary: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  id: string;
  content: string;
  speaker?: string | null;
  style?: string | null;
  createdAt: string;
}

export interface GeneratedCaption {
  id: string;
  transcriptId: string;
  originalText: string;
  editedText?: string | null;
  finalText: string;
  speaker?: string | null;
  style?: string | null;
  outputKind?: OutputKind | null;
  version: number;
  isUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionVersion {
  id: string;
  captionId: string;
  text: string;
  version: number;
  source: "ai" | "edit";
  createdAt: string;
}

export interface Feedback {
  id: string;
  captionId: string;
  type: FeedbackType;
  note?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  role: "admin" | "editor";
  createdAt: string;
}

/** API request / response shapes */

export interface GenerateRequest {
  transcript: string;
  speaker: string;
  style: CaptionStyle;
  count?: number;
  previewOnly?: boolean;
  outputKind?: OutputKind;
}

export interface GenerateResponse {
  transcriptId: string;
  captions: GeneratedCaption[];
  promptPreview?: string;
}

export interface IterateRequest {
  transcript: string;
  speaker: string;
  style: CaptionStyle;
  currentCaptions: string[];
  iterationNotes: string;
  count?: number;
  outputKind?: OutputKind;
}

export interface FeedbackRequest {
  captionId: string;
  type: FeedbackType;
  editedText?: string;
  note?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface AssembledPromptParts {
  rules: string[];
  principles: string[];
  speakerProfile: SpeakerProfile | null;
  goodExamples: GoodExample[];
  badExamples: BadExample[];
  template: string;
  transcript: string;
  speaker: string;
  style: CaptionStyle;
  count: number;
}
