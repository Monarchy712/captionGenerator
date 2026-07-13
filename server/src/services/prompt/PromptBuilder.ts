/**
 * PromptBuilder — assembles the full prompt from DB context.
 * Speaker is a free-text guest name only (no predefined profiles).
 */

import type { AssembledPromptParts, CaptionStyle, GoodExample } from "@caption-studio/shared";
import {
  PromptTemplateRepository,
  RuleRepository,
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

function formatSpeakerContext(speakerName: string): string {
  const name = speakerName.trim() || "the speaker";
  return [
    `Guest / speaker name: ${name}`,
    "This is a podcast or clip guest — do NOT invent a fixed persona, tone profile, or vocabulary list.",
    `When it strengthens the caption, mention "${name}" by name (attribution). Do not force their name into every line awkwardly.`,
  ].join("\n");
}

function formatGoodExamples(examples: GoodExample[]): string {
  if (examples.length === 0) return "(No good examples available yet.)";
  return examples
    .map((ex, i) => {
      const meta = [ex.style, ex.category, ex.speaker].filter(Boolean).join(" / ");
      return `### Good Example ${i + 1}${meta ? ` [${meta}]` : ""}\nTranscript excerpt:\n${ex.transcript}\n\nWinning caption:\n${ex.caption}`;
    })
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
    private templatesRepo = new PromptTemplateRepository(),
    private retriever: ExampleRetriever = createExampleRetriever()
  ) {}

  async build(input: PromptBuilderInput): Promise<BuiltPrompt> {
    const count = input.count ?? 5;
    const transcript = input.transcript.trim();
    const speaker = input.speaker.trim();
    if (!transcript) throw new AppError(400, "Transcript is required");
    if (!speaker) throw new AppError(400, "Speaker name is required");

    const [rules, principles, template, examples] = await Promise.all([
      this.rulesRepo.findAll(true),
      this.principlesRepo.findAll(true),
      this.templatesRepo.findActive(),
      this.retriever.retrieve({
        transcript,
        style: input.style,
      }),
    ]);

    if (!template) {
      throw new AppError(500, "No active prompt template configured");
    }

    const rulesText =
      rules.length > 0
        ? [
            "HARD CONSTRAINTS — follow every rule below. If a good example conflicts with a rule, the RULE wins.",
            ...rules.map((r, i) => `${i + 1}. ${r.content}`),
          ].join("\n")
        : "(No rules configured.)";

    const principlesText =
      principles.length > 0
        ? principles.map((p) => `### ${p.title}\n${p.content}`).join("\n\n")
        : "(No writing principles configured.)";

    const parts: AssembledPromptParts = {
      rules: rules.map((r) => r.content),
      principles: principles.map((p) => `**${p.title}**: ${p.content}`),
      speakerProfile: null,
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
      speaker,
      style: input.style,
      count,
    };

    const prompt =
      applyTemplate(template.content, {
        count: String(count),
        rules: rulesText,
        principles: principlesText,
        speaker_profile: formatSpeakerContext(speaker),
        good_examples: formatGoodExamples(parts.goodExamples),
        bad_examples: formatBadExamples(parts.badExamples),
        style: input.style,
        speaker,
        transcript,
      }) +
      `

## OUTPUT FORMAT (MANDATORY)
Produce exactly ${count} FULL multi-line captions matching the good-example structure (hook + attribution + quotes). Never one-liners.
Separate each caption with this exact delimiter on its own line:
<<<CAPTION>>>
Do not use JSON. Do not use markdown fences. Do not add commentary before or after.`;

    return { prompt, parts };
  }
}
