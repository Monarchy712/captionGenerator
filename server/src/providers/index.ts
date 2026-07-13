import { config } from "../config";
import type { AIProvider } from "./AIProvider";
import { ClaudeProvider } from "./ClaudeProvider";
import { MockAIProvider } from "./MockProvider";

/**
 * Factory for AI providers. Swap Anthropic ↔ OpenAI by changing AI_PROVIDER
 * and adding an OpenAIProvider that implements the same interface.
 */
export function createAIProvider(): AIProvider {
  switch (config.aiProvider) {
    case "mock":
      return new MockAIProvider();
    case "openai":
      // Future: return new OpenAIProvider();
      throw new Error("OpenAI provider is not implemented yet. Use anthropic or mock.");
    case "anthropic":
    default: {
      try {
        return new ClaudeProvider();
      } catch {
        console.warn("[AI] Falling back to MockAIProvider — configure ANTHROPIC_API_KEY for live generation.");
        return new MockAIProvider();
      }
    }
  }
}

export * from "./AIProvider";
export * from "./ClaudeProvider";
export * from "./MockProvider";
