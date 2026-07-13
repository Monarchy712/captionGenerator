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
          `Mock hook ${i + 1}: the quiet part got said out loud.`,
          `Specific claim. Real tension. Zero fluff.`,
          `(Replace AI_PROVIDER=anthropic + set ANTHROPIC_API_KEY for live generation.)`,
        ].join("\n")
      );
    }
    return captions;
  }
}
