import { config } from "../config";
import type { AIProvider } from "./AIProvider";
import { ClaudeProvider } from "./ClaudeProvider";
import { GroqProvider } from "./GroqProvider";
import { MockAIProvider } from "./MockProvider";

/**
 * Factory for AI providers.
 * Local testing: AI_PROVIDER=groq
 * Production:    AI_PROVIDER=anthropic
 */
export function createAIProvider(): AIProvider {
  switch (config.aiProvider) {
    case "mock":
      return new MockAIProvider();
    case "groq":
      return new GroqProvider();
    case "openai":
      throw new Error("OpenAI provider is not implemented yet. Use groq or anthropic.");
    case "anthropic":
      return new ClaudeProvider();
    default:
      throw new Error(`Unknown AI_PROVIDER: ${config.aiProvider}`);
  }
}

export * from "./AIProvider";
export * from "./ClaudeProvider";
export * from "./GroqProvider";
export * from "./MockProvider";
