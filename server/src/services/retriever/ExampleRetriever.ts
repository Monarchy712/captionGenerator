/**
 * ExampleRetriever abstraction.
 *
 * Current: SQLite top-N retrieval with style preference.
 * Future: swap implementation to Chroma/Qdrant vector search without
 * changing PromptBuilder or callers.
 */

import type { CaptionStyle } from "@caption-studio/shared";
import { BadExampleRepository, GoodExampleRepository } from "../../repositories";
import { config } from "../../config";

export interface RetrievedExamples {
  good: Awaited<ReturnType<GoodExampleRepository["findRelevant"]>>;
  bad: Awaited<ReturnType<BadExampleRepository["findTop"]>>;
}

export interface ExampleRetriever {
  retrieve(input: {
    transcript: string;
    style?: CaptionStyle | string;
    topN?: number;
  }): Promise<RetrievedExamples>;
}

/**
 * SQLite-backed retriever. Selects relevant good examples by style match,
 * plus recent bad examples. Designed to be replaced by vector search.
 */
export class SqliteExampleRetriever implements ExampleRetriever {
  constructor(
    private goodRepo = new GoodExampleRepository(),
    private badRepo = new BadExampleRepository()
  ) {}

  async retrieve(input: {
    transcript: string;
    style?: CaptionStyle | string;
    topN?: number;
  }): Promise<RetrievedExamples> {
    const topN = input.topN ?? config.exampleTopN;

    // `transcript` is accepted for future embedding similarity.
    void input.transcript;

    const [good, bad] = await Promise.all([
      this.goodRepo.findRelevant({
        style: input.style,
        limit: topN,
      }),
      this.badRepo.findTop(Math.min(topN, 4)),
    ]);

    return { good, bad };
  }
}

/**
 * Placeholder for future vector DB implementation.
 * Keep the same interface so PromptBuilder stays unchanged.
 */
export class VectorExampleRetriever implements ExampleRetriever {
  async retrieve(): Promise<RetrievedExamples> {
    throw new Error(
      "VectorExampleRetriever is not implemented yet. Wire Chroma/Qdrant here."
    );
  }
}

export function createExampleRetriever(): ExampleRetriever {
  return new SqliteExampleRetriever();
}
