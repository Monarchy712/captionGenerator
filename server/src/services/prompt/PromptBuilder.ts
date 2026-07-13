/**
 * PromptBuilder — assembles the full prompt from DB context.
 * Speaker is a free-text guest name only (no predefined profiles).
 */

import type {
  AssembledPromptParts,
  CaptionStyle,
  GoodExample,
  OutputKind,
} from "@caption-studio/shared";
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
  outputKind?: OutputKind;
  /** When set, model refines these captions instead of generating from scratch. */
  currentCaptions?: string[];
  iterationNotes?: string;
}

export interface BuiltPrompt {
  prompt: string;
  parts: AssembledPromptParts;
}

/** Word-limit rules (e.g. 10–15 words, max 25 words) — skipped for Shorts outputs. */
export function isWordLimitRule(content: string): boolean {
  return (
    /\b\d+\s*[–\-]\s*\d+\s*words?\b/i.test(content) ||
    /\b(?:maximum|max|not more than|at most|up to)\s+\d+\s*words?\b/i.test(content) ||
    /\b\d+\s*words?\s*max(?:imum)?\b/i.test(content)
  );
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

function modeInstructions(kind: OutputKind, count: number): string {
  switch (kind) {
    case "shorts_title":
      return `
## OUTPUT MODE — SHORTS TITLE
Produce exactly ${count} YouTube Shorts titles.
Each title is a single line — punchy, scroll-stopping, specific.
Do NOT use the X-caption 3-part format (no attribution line, no quote stack).
Do NOT invent word-count limits that aren't in the rules above.
Separate each title with <<<CAPTION>>> on its own line.`;
    case "shorts_caption":
      return `
## OUTPUT MODE — SHORTS CAPTION
Produce exactly ${count} YouTube Shorts captions/descriptions for the video.
These are Shorts captions — not the full X / Twitter caption stack.
Keep voice sharp and specific; still obey active rules.
Do NOT invent word-count limits that aren't in the rules above.
Separate each caption with <<<CAPTION>>> on its own line.`;
    case "x_captions":
    default:
      return `
## OUTPUT FORMAT (MANDATORY)
Produce exactly ${count} FULL multi-line captions matching the good-example structure (hook + attribution + quotes). Never one-liners.
Separate each caption with this exact delimiter on its own line:
<<<CAPTION>>>
Do not use JSON. Do not use markdown fences. Do not add commentary before or after.`;
  }
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
    const outputKind: OutputKind = input.outputKind ?? "x_captions";
    const isShorts = outputKind === "shorts_title" || outputKind === "shorts_caption";

    if (!transcript) throw new AppError(400, "Transcript is required");
    if (!speaker) throw new AppError(400, "Speaker name is required");

    const [allRules, principles, template, examples] = await Promise.all([
      this.rulesRepo.findAll(true),
      this.principlesRepo.findAll(true),
      this.templatesRepo.findActive(),
      isShorts
        ? Promise.resolve({ good: [], bad: [] })
        : this.retriever.retrieve({
            transcript,
            style: input.style,
          }),
    ]);

    if (!template) {
      throw new AppError(500, "No active prompt template configured");
    }

    const rules = isShorts ? allRules.filter((r) => !isWordLimitRule(r.content)) : allRules;

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

    const goodExamples = examples.good.map((ex) => ({
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
    }));

    const badExamples = examples.bad.map((ex) => ({
      id: ex.id,
      caption: ex.caption,
      reason: ex.reason,
      isActive: ex.isActive,
      createdAt: ex.createdAt.toISOString(),
      updatedAt: ex.updatedAt.toISOString(),
    }));

    const parts: AssembledPromptParts = {
      rules: rules.map((r) => r.content),
      principles: principles.map((p) => `**${p.title}**: ${p.content}`),
      speakerProfile: null,
      goodExamples,
      badExamples,
      template: template.content,
      transcript,
      speaker,
      style: input.style,
      count,
    };

    const isIterate =
      !!input.iterationNotes?.trim() &&
      Array.isArray(input.currentCaptions) &&
      input.currentCaptions.length > 0;

    const iterationBlock = isIterate
      ? `

## ITERATION MODE
You are refining an existing set of outputs — not starting from scratch.

### Current outputs
${input
  .currentCaptions!.map((c, i) => `### Current ${i + 1}\n${c.trim()}`)
  .join("\n\n")}

### Iteration instructions from the editor
${input.iterationNotes!.trim()}

Apply the iteration instructions while still obeying ALL active rules and principles for this mode.
Keep what already works. Change what the editor asked for.
Produce ${count} improved outputs.`
      : "";

    const examplesNote = isShorts
      ? `

## EXAMPLES
No good/bad examples are injected for Shorts Title / Shorts Caption. Rely on rules + principles + transcript.`
      : "";

    const prompt =
      applyTemplate(template.content, {
        count: String(count),
        rules: rulesText,
        principles: principlesText,
        speaker_profile: formatSpeakerContext(speaker),
        good_examples: isShorts
          ? "(Intentionally empty for Shorts — do not invent examples.)"
          : formatGoodExamples(goodExamples),
        bad_examples: isShorts
          ? "(Intentionally empty for Shorts — do not invent anti-examples.)"
          : formatBadExamples(badExamples),
        style: input.style,
        speaker,
        transcript,
      }) +
      examplesNote +
      iterationBlock +
      modeInstructions(outputKind, count);

    return { prompt, parts };
  }
}
