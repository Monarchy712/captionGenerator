import type { CaptionStyle } from "@caption-studio/shared";
import { createAIProvider, type AIProvider } from "../../providers";
import { CaptionRepository, TranscriptRepository } from "../../repositories";
import { PromptBuilder } from "../prompt/PromptBuilder";
import { AppError } from "../../utils/helpers";

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
  }) {
    const count = input.count ?? 5;
    const { prompt, parts } = await this.promptBuilder.build({
      transcript: input.transcript,
      speaker: input.speaker,
      style: input.style,
      count,
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
      }))
    );

    return {
      transcriptId: transcript.id,
      captions: captions.map((c) => ({
        id: c.id,
        transcriptId: c.transcriptId,
        originalText: c.originalText,
        editedText: c.editedText,
        finalText: c.finalText,
        speaker: c.speaker,
        style: c.style,
        version: c.version,
        isUsed: c.isUsed,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
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

  /** Build prompt without calling the model — for admin Prompt Preview. */
  async previewPrompt(input: {
    transcript: string;
    speaker: string;
    style: CaptionStyle;
    count?: number;
  }) {
    return this.promptBuilder.build(input);
  }
}
