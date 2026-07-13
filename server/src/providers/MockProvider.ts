import { BaseAIProvider, type GenerateCaptionsInput } from "./AIProvider";

/**
 * Deterministic mock provider for local development without an API key.
 */
export class MockAIProvider extends BaseAIProvider {
  readonly name = "mock";

  async generateCaptions(input: GenerateCaptionsInput): Promise<string[]> {
    const captions: string[] = [];
    for (let i = 0; i < input.count; i++) {
      captions.push(
        [
          `mock hook ${i + 1}: the quiet part got said out loud`,
          ``,
          `Mock Guest from Caption Studio, on why one-liners fail`,
          ``,
          `"This is a multi-line mock caption so the UI can be tested."`,
          `"Replace AI_PROVIDER=groq and set GROQ_API_KEY for live generation."`,
          `"Each caption should look like the good examples — not a single line."`,
        ].join("\n")
      );
    }
    return captions;
  }
}
