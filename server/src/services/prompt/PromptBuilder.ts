/**
 * PromptBuilder — assembles the full prompt from DB context scoped by outputKind.
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
  currentCaptions?: string[];
  iterationNotes?: string;
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

function modeInstructions(kind: OutputKind, count: number): string {
  switch (kind) {
    case "shorts_title":
      return `

## OVERRIDE — DISREGARD ANY CONFLICTING INSTRUCTIONS ABOVE
The GENERATION INSTRUCTIONS section above (if present) was written for X Captions.
You are producing SHORTS TITLE output. Follow ONLY the instructions below.

## OUTPUT MODE — SHORTS TITLE
Produce exactly ${count} YouTube Shorts titles.
Each title is a single line — punchy, scroll-stopping, specific.
Do NOT produce multi-line captions. Do NOT add attribution lines or quote stacks.
Do NOT follow the "Example output shape" section above — that is for X Captions only.
Separate each title with <<<CAPTION>>> on its own line.
No JSON. No markdown. No commentary.`;
    case "shorts_caption":
      return `

## OVERRIDE — DISREGARD ANY CONFLICTING INSTRUCTIONS ABOVE
The GENERATION INSTRUCTIONS section above (if present) was written for X Captions.
You are producing SHORTS CAPTION output. Follow ONLY the instructions below.

## OUTPUT MODE — SHORTS CAPTION
Produce exactly ${count} YouTube Shorts captions/descriptions for the video.
These are Shorts captions — not the full X / Twitter caption stack.
Keep voice sharp and specific; still obey active rules for this mode.
Do NOT produce multi-line hook+attribution+quotes blocks. Each output is a short standalone caption.
Separate each caption with <<<CAPTION>>> on its own line.
No JSON. No markdown. No commentary.`;
    case "shorts_gist":
      return `

## OVERRIDE — DISREGARD ANY CONFLICTING INSTRUCTIONS ABOVE
The GENERATION INSTRUCTIONS section above (if present) was written for X Captions.
You are producing SHORTS GIST output. Follow ONLY the instructions below.

## OUTPUT MODE — SHORTS GIST
Produce exactly ${count} gist lines.
Each gist is exactly ONE sentence — max ~25 words — capturing the core specific insight from the transcript.
Do NOT produce multi-line captions. Do NOT add an attribution line. Do NOT add a quote stack.
Do NOT follow the "Example output shape" section above — that is for X Captions only.
Each gist stands alone as a single punchy sentence.
Separate each gist with <<<CAPTION>>> on its own line.
No JSON. No markdown. No commentary.`;
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

    if (!transcript) throw new AppError(400, "Transcript is required");
    if (!speaker) throw new AppError(400, "Speaker name is required");

    const [rules, principles, template, examples] = await Promise.all([
      this.rulesRepo.findAll(true, outputKind),
      this.principlesRepo.findAll(true, outputKind),
      this.templatesRepo.findActive(outputKind),
      this.retriever.retrieve({
        transcript,
        style: input.style,
        outputKind,
      }),
    ]);

    if (!template) {
      throw new AppError(500, `No active prompt template configured for ${outputKind}`);
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

    const goodExamples = examples.good.map((ex) => ({
      id: ex.id,
      transcript: ex.transcript,
      caption: ex.caption,
      category: ex.category,
      tags: ex.tags,
      speaker: ex.speaker,
      style: ex.style,
      outputKind: (ex.outputKind as OutputKind) ?? outputKind,
      isActive: ex.isActive,
      createdAt: ex.createdAt.toISOString(),
      updatedAt: ex.updatedAt.toISOString(),
    }));

    const badExamples = examples.bad.map((ex) => ({
      id: ex.id,
      caption: ex.caption,
      reason: ex.reason,
      outputKind: (ex.outputKind as OutputKind) ?? outputKind,
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

    const prompt =
      applyTemplate(template.content, {
        count: String(count),
        rules: rulesText,
        principles: principlesText,
        speaker_profile: formatSpeakerContext(speaker),
        good_examples: formatGoodExamples(goodExamples),
        bad_examples: formatBadExamples(badExamples),
        style: input.style,
        speaker,
        transcript,
      }) +
      iterationBlock +
      modeInstructions(outputKind, count);

    return { prompt, parts };
  }
}
