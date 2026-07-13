/**
 * AI provider abstraction — Claude today, OpenAI (or others) later.
 */

export interface GenerateCaptionsInput {
  prompt: string;
  count: number;
}

export interface AIProvider {
  readonly name: string;
  generateCaptions(input: GenerateCaptionsInput): Promise<string[]>;
  generateSingle(prompt: string): Promise<string>;
  generateAlternative(prompt: string): Promise<string>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract generateCaptions(input: GenerateCaptionsInput): Promise<string[]>;

  async generateSingle(prompt: string): Promise<string> {
    const captions = await this.generateCaptions({ prompt, count: 1 });
    if (!captions[0]) throw new Error("Provider returned no caption");
    return captions[0];
  }

  async generateAlternative(prompt: string): Promise<string> {
    return this.generateSingle(
      `${prompt}\n\nGenerate ONE alternative caption that is meaningfully different from typical outputs.`
    );
  }
}

/**
 * Parse a JSON array of strings from model output, with light repair.
 */
export function parseCaptionArray(raw: string, expectedCount: number): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((c) => String(c).trim()).filter(Boolean).slice(0, expectedCount);
    }
  } catch {
    // Fall through to line-based extraction
  }

  // Fallback: numbered or bulleted lines
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.replace(/^[\d\-\*\.\)]+\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter((l) => l.length > 0 && !l.startsWith("[") && !l.startsWith("]"));

  if (lines.length > 0) return lines.slice(0, expectedCount);

  throw new Error("Failed to parse captions from model response");
}
