import { z } from "zod";
import { CAPTION_STYLES, OUTPUT_KINDS } from "@caption-studio/shared";

export const generateSchema = z.object({
  transcript: z.string().min(1, "Transcript is required"),
  speaker: z.string().min(1, "Speaker name is required"),
  style: z.enum(CAPTION_STYLES as [string, ...string[]]),
  count: z.number().int().min(1).max(10).optional().default(5),
  previewOnly: z.boolean().optional().default(false),
  outputKind: z.enum(OUTPUT_KINDS as [string, ...string[]]).optional().default("x_captions"),
});

export const iterateSchema = z.object({
  transcript: z.string().min(1, "Transcript is required"),
  speaker: z.string().min(1, "Speaker name is required"),
  style: z.enum(CAPTION_STYLES as [string, ...string[]]),
  currentCaptions: z.array(z.string().min(1)).min(1, "At least one current caption is required"),
  iterationNotes: z.string().min(1, "Iteration notes are required"),
  count: z.number().int().min(1).max(10).optional(),
  outputKind: z.enum(OUTPUT_KINDS as [string, ...string[]]).optional().default("x_captions"),
});

export const feedbackSchema = z.object({
  captionId: z.string().min(1),
  type: z.enum(["like", "dislike", "edit", "used"]),
  editedText: z.string().optional(),
  note: z.string().optional(),
});

export const goodExampleSchema = z.object({
  transcript: z.string().min(1),
  caption: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  speaker: z.string().optional().default(""),
  style: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const badExampleSchema = z.object({
  caption: z.string().min(1),
  reason: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const rulesReplaceSchema = z.object({
  rules: z.array(
    z.object({
      content: z.string().min(1),
      sortOrder: z.number().int(),
      isActive: z.boolean().optional(),
    })
  ),
});

export const principleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const speakerSchema = z.object({
  name: z.string().min(1),
  tone: z.string().min(1),
  founderStyle: z.string().optional(),
  technicalDepth: z.string().min(1),
  audience: z.string().min(1),
  writingStyle: z.string().min(1),
  vocabulary: z.string().min(1),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const promptTemplateUpdateSchema = z.object({
  content: z.string().min(1),
});

export const promptRevertSchema = z.object({
  version: z.number().int().min(1),
});
