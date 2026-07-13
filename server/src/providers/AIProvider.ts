/**
 * AI provider abstraction — Claude / Groq / mock.
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

const CAPTION_DELIMITER = "<<<CAPTION>>>";

/**
 * Parse model output into full multi-line captions.
 *
 * Preferred format: blocks separated by <<<CAPTION>>>
 * Also supports a JSON array of strings (with \\n escapes).
 * Never treats each single line as its own caption.
 */
export function parseCaptionArray(raw: string, expectedCount: number): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const fromDelimiter = splitByDelimiter(cleaned);
  if (fromDelimiter.length > 0) {
    return fromDelimiter.slice(0, expectedCount);
  }

  const fromJson = tryParseJsonCaptions(cleaned);
  if (fromJson.length > 0) {
    return fromJson.slice(0, expectedCount);
  }

  // Last resort: substantial blocks separated by blank lines (not single lines)
  const blocks = cleaned
    .split(/\n{2,}/)
    .map((b) => stripJsonDebris(b.trim()))
    .filter((b) => b.length >= 60 && !/^[\[\],]+$/.test(b));

  if (blocks.length >= Math.min(2, expectedCount)) {
    return blocks.slice(0, expectedCount);
  }

  throw new Error(
    "Failed to parse captions from model response. Expected <<<CAPTION>>> blocks or a JSON array of multi-line strings."
  );
}

function splitByDelimiter(text: string): string[] {
  if (!text.includes(CAPTION_DELIMITER) && !/<<<\s*CAPTION\s*>>>/i.test(text)) {
    return [];
  }
  return text
    .split(/<<<\s*CAPTION\s*>>>/i)
    .map((part) => stripJsonDebris(part.trim()))
    .filter((part) => part.length > 0);
}

function tryParseJsonCaptions(text: string): string[] {
  const candidates = [text];
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    candidates.push(text.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    for (const attempt of [candidate, repairLiteralNewlinesInJsonStrings(candidate)]) {
      try {
        const parsed = JSON.parse(attempt);
        if (Array.isArray(parsed)) {
          return parsed
            .map((c) => stripJsonDebris(String(c).trim()))
            .filter((c) => c.length > 0);
        }
      } catch {
        // try next
      }
    }
  }
  return [];
}

/**
 * Models often emit real newlines inside JSON strings, which is invalid.
 * Convert those to escaped \\n while leaving structural newlines alone.
 */
function repairLiteralNewlinesInJsonStrings(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        out += ch;
        inString = false;
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        continue;
      }
      out += ch;
    } else {
      out += ch;
      if (ch === '"') inString = true;
    }
  }
  return out;
}

/** Strip leftover JSON punctuation from broken parse attempts — without eating quote marks inside captions. */
function stripJsonDebris(text: string): string {
  let t = text.trim();

  // Drop wrapping array brackets only when they wrap the whole block
  if (t.startsWith("[") && t.endsWith("]")) {
    t = t.slice(1, -1).trim();
  }

  // Drop a single outer JSON string wrap: "....entire caption...."
  if (t.startsWith('"') && t.endsWith('"')) {
    const inner = t.slice(1, -1);
    // Only unwrap if this looks like one JSON string (escaped quotes inside OK)
    if (!/(^|[^\\])"/.test(inner.replace(/\\"/g, ""))) {
      t = inner.replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }

  // Trailing JSON crumbs like `",` or `"],` left by broken line splits
  t = t.replace(/^[\[\]\s,]+/, "").replace(/[\]\s,]+$/, "");
  t = t.replace(/\\n/g, "\n");

  return t.trim();
}

export { CAPTION_DELIMITER };
