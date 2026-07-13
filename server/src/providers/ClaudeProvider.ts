import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { BaseAIProvider, parseCaptionArray, type GenerateCaptionsInput } from "./AIProvider";
import { AppError } from "../utils/helpers";

export class ClaudeProvider extends BaseAIProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor(apiKey = config.anthropicApiKey, private model = config.claudeModel) {
    super();
    if (!apiKey || apiKey.includes("your-key")) {
      throw new AppError(
        503,
        "ANTHROPIC_API_KEY is not configured. Set it in .env or use AI_PROVIDER=mock for local development."
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async generateCaptions(input: GenerateCaptionsInput): Promise<string[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system:
        "You write multi-line crypto clip captions matching the good-example structure (hook, attribution, quotes). Separate each full caption with <<<CAPTION>>>. Never return JSON. Never return one-liners.",
      messages: [{ role: "user", content: input.prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new AppError(502, "Claude returned no text content");
    }

    return parseCaptionArray(textBlock.text, input.count);
  }
}
