import type { CaptionStyle, OutputKind } from "@caption-studio/shared";
import { createAIProvider, type AIProvider } from "../providers";
import { CaptionRepository, TranscriptRepository } from "../repositories";
import { PromptBuilder } from "./prompt/PromptBuilder";
import { AppError } from "../utils/helpers";

function mapCaption(c: {
  id: string;
  transcriptId: string;
  originalText: string;
  editedText: string | null;
  finalText: string;
  speaker: string | null;
  style: string | null;
  outputKind?: string | null;
  version: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    transcriptId: c.transcriptId,
    originalText: c.originalText,
    editedText: c.editedText,
    finalText: c.finalText,
    speaker: c.speaker,
    style: c.style,
    outputKind: (c.outputKind as OutputKind) ?? "x_captions",
    version: c.version,
    isUsed: c.isUsed,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export class ClaudeService {
  constructor(
    private provider: AIProvider = createAIProvider(),
    private promptBuilder = new PromptBuilder(),
    private transcriptRepo = new TranscriptRepository(),
    private captionRepo = new CaptionRepository()
  ) {}

  async generateCaptions(input: {
    transcript: string;
    speaker: string;
    style: CaptionStyle;
    count?: number;
    previewOnly?: boolean;
    outputKind?: OutputKind;
  }) {
    const count = input.count ?? 5;
    const outputKind = input.outputKind ?? "x_captions";
    const { prompt, parts } = await this.promptBuilder.build({
      transcript: input.transcript,
      speaker: input.speaker,
      style: input.style,
      count,
      outputKind,
    });

    if (input.previewOnly) {
      return {
        transcriptId: null as string | null,
        captions: [],
        promptPreview: prompt,
        parts,
      };
    }

    const texts = await this.provider.generateCaptions({ prompt, count });
    if (texts.length === 0) {
      throw new AppError(502, "AI provider returned zero captions");
    }

    const transcript = await this.transcriptRepo.create({
      content: input.transcript.trim(),
      speaker: input.speaker,
      style: input.style,
    });

    const captions = await this.captionRepo.createMany(
      texts.map((text) => ({
        transcriptId: transcript.id,
        originalText: text,
        speaker: input.speaker,
        style: input.style,
        outputKind,
      }))
    );

    return {
      transcriptId: transcript.id,
      captions: captions.map(mapCaption),
      promptPreview: prompt,
      parts,
    };
  }

  async iterateCaptions(input: {
    transcript: string;
    speaker: string;
    style: CaptionStyle;
    currentCaptions: string[];
    iterationNotes: string;
    count?: number;
    outputKind?: OutputKind;
  }) {
    const notes = input.iterationNotes.trim();
    const current = input.currentCaptions.map((c) => c.trim()).filter(Boolean);
    if (!notes) throw new AppError(400, "Iteration notes are required");
    if (current.length === 0) throw new AppError(400, "Current captions are required");

    const outputKind = input.outputKind ?? "x_captions";
    const count = input.count ?? current.length;
    const { prompt, parts } = await this.promptBuilder.build({
      transcript: input.transcript,
      speaker: input.speaker,
      style: input.style,
      count,
      outputKind,
      currentCaptions: current,
      iterationNotes: notes,
    });

    const texts = await this.provider.generateCaptions({ prompt, count });
    if (texts.length === 0) {
      throw new AppError(502, "AI provider returned zero captions");
    }

    const transcript = await this.transcriptRepo.create({
      content: input.transcript.trim(),
      speaker: input.speaker,
      style: input.style,
    });

    const captions = await this.captionRepo.createMany(
      texts.map((text) => ({
        transcriptId: transcript.id,
        originalText: text,
        speaker: input.speaker,
        style: input.style,
        outputKind,
      }))
    );

    return {
      transcriptId: transcript.id,
      captions: captions.map(mapCaption),
      promptPreview: prompt,
      parts,
    };
  }

  async generateAlternative(input: {
    transcript: string;
    speaker: string;
    style: CaptionStyle;
  }) {
    const { prompt } = await this.promptBuilder.build({ ...input, count: 1 });
    const text = await this.provider.generateAlternative(prompt);
    return { caption: text, promptPreview: prompt };
  }

  async generateSingle(input: {
    transcript: string;
    speaker: string;
    style: CaptionStyle;
  }) {
    const { prompt } = await this.promptBuilder.build({ ...input, count: 1 });
    const text = await this.provider.generateSingle(prompt);
    return { caption: text, promptPreview: prompt };
  }

  async previewPrompt(input: {
    transcript: string;
    speaker: string;
    style: CaptionStyle;
    count?: number;
    outputKind?: OutputKind;
  }) {
    return this.promptBuilder.build(input);
  }
}
