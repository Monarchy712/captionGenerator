import { config } from "../config";
import { BaseAIProvider, parseCaptionArray, type GenerateCaptionsInput } from "./AIProvider";
import { AppError } from "../utils/helpers";

/**
 * Groq uses an OpenAI-compatible Chat Completions API.
 * Ideal for local/testing; swap AI_PROVIDER=anthropic in production.
 */
export class GroqProvider extends BaseAIProvider {
  readonly name = "groq";

  constructor(
    private apiKey = config.groqApiKey,
    private model = config.groqModel,
    private baseUrl = config.groqBaseUrl
  ) {
    super();
    if (!apiKey || apiKey.includes("your-key")) {
      throw new AppError(
        503,
        "GROQ_API_KEY is not configured. Set it in .env (get a key at https://console.groq.com)"
      );
    }
  }

  async generateCaptions(input: GenerateCaptionsInput): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.7,
        max_tokens: 2048,
        messages: [
          {
            role: "system",
            content:
              "You are a caption writer. Always respond with a valid JSON array of strings only — no markdown fences, no commentary.",
          },
          { role: "user", content: input.prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new AppError(
        502,
        `Groq API error (${response.status}): ${errText.slice(0, 400) || response.statusText}`
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new AppError(502, "Groq returned no text content");
    }

    return parseCaptionArray(text, input.count);
  }
}
