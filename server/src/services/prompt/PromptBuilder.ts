/**
 * PromptBuilder — assembles the full Claude prompt from DB context.
 * The frontend never builds prompts; this is the single source of truth.
 */

import type { AssembledPromptParts, CaptionStyle, GoodExample, SpeakerProfile } from "@caption-studio/shared";
import {
  PromptTemplateRepository,
  RuleRepository,
  SpeakerRepository,
  WritingPrincipleRepository,
} from "../../repositories";
import { createExampleRetriever, type ExampleRetriever } from "../retriever/ExampleRetriever";
import { AppError } from "../../utils/helpers";

export interface PromptBuilderInput {
  transcript: string;
  speaker: string;
  style: CaptionStyle;
  count?: number;
}

export interface BuiltPrompt {
  prompt: string;
  parts: AssembledPromptParts;
}

function formatSpeakerProfile(profile: SpeakerProfile | null, speakerName: string): string {
  if (!profile) {
    return `Speaker: ${speakerName}\n(No detailed profile on file — write in a clear, professional crypto-native voice.)`;
  }
  return [
    `Name: ${profile.name}`,
    `Tone: ${profile.tone}`,
    `Founder style: ${profile.founderStyle}`,
    `Technical depth: ${profile.technicalDepth}`,
    `Audience: ${profile.audience}`,
    `Writing style: ${profile.writingStyle}`,
    `Vocabulary: ${profile.vocabulary}`,
    profile.notes ? `Notes: ${profile.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatGoodExamples(examples: GoodExample[]): string {
  if (examples.length === 0) return "(No good examples available yet.)";
  return examples
    .map(
      (ex, i) =>
        `### Good Example ${i + 1} [${ex.speaker}${ex.style ? ` / ${ex.style}` : ""}]\nTranscript excerpt:\n${ex.transcript}\n\nWinning caption:\n${ex.caption}`
    )
    .join("\n\n");
}

function formatBadExamples(examples: { caption: string; reason: string }[]): string {
  if (examples.length === 0) return "(No bad examples on file.)";
  return examples
    .map((ex, i) => `### Bad Example ${i + 1}\nCaption: ${ex.caption}\nWhy bad: ${ex.reason}`)
    .join("\n\n");
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export class PromptBuilder {
  constructor(
    private rulesRepo = new RuleRepository(),
    private principlesRepo = new WritingPrincipleRepository(),
    private speakersRepo = new SpeakerRepository(),
    private templatesRepo = new PromptTemplateRepository(),
    private retriever: ExampleRetriever = createExampleRetriever()
  ) {}

  async build(input: PromptBuilderInput): Promise<BuiltPrompt> {
    const count = input.count ?? 5;
    const transcript = input.transcript.trim();
    if (!transcript) throw new AppError(400, "Transcript is required");

    const [rules, principles, speakerProfile, template, examples] = await Promise.all([
      this.rulesRepo.findAll(true),
      this.principlesRepo.findAll(true),
      this.speakersRepo.findByName(input.speaker),
      this.templatesRepo.findActive(),
      this.retriever.retrieve({
        transcript,
        speaker: input.speaker,
        style: input.style,
      }),
    ]);

    if (!template) {
      throw new AppError(500, "No active prompt template configured");
    }

    const rulesText =
      rules.length > 0
        ? rules.map((r, i) => `${i + 1}. ${r.content}`).join("\n")
        : "(No rules configured.)";

    const principlesText =
      principles.length > 0
        ? principles.map((p) => `### ${p.title}\n${p.content}`).join("\n\n")
        : "(No writing principles configured.)";

    const parts: AssembledPromptParts = {
      rules: rules.map((r) => r.content),
      principles: principles.map((p) => `**${p.title}**: ${p.content}`),
      speakerProfile: speakerProfile
        ? {
            id: speakerProfile.id,
            name: speakerProfile.name,
            tone: speakerProfile.tone,
            founderStyle: speakerProfile.founderStyle,
            technicalDepth: speakerProfile.technicalDepth,
            audience: speakerProfile.audience,
            writingStyle: speakerProfile.writingStyle,
            vocabulary: speakerProfile.vocabulary,
            notes: speakerProfile.notes,
            isActive: speakerProfile.isActive,
            createdAt: speakerProfile.createdAt.toISOString(),
            updatedAt: speakerProfile.updatedAt.toISOString(),
          }
        : null,
      goodExamples: examples.good.map((ex) => ({
        id: ex.id,
        transcript: ex.transcript,
        caption: ex.caption,
        category: ex.category,
        tags: ex.tags,
        speaker: ex.speaker,
        style: ex.style,
        isActive: ex.isActive,
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      })),
      badExamples: examples.bad.map((ex) => ({
        id: ex.id,
        caption: ex.caption,
        reason: ex.reason,
        isActive: ex.isActive,
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      })),
      template: template.content,
      transcript,
      speaker: input.speaker,
      style: input.style,
      count,
    };

    const prompt = applyTemplate(template.content, {
      count: String(count),
      rules: rulesText,
      principles: principlesText,
      speaker_profile: formatSpeakerProfile(parts.speakerProfile, input.speaker),
      good_examples: formatGoodExamples(parts.goodExamples),
      bad_examples: formatBadExamples(parts.badExamples),
      style: input.style,
      speaker: input.speaker,
      transcript,
    });

    return { prompt, parts };
  }
}
