/**
 * ExampleRetriever abstraction — scopes good/bad examples by outputKind.
 */

import type { CaptionStyle, OutputKind } from "@caption-studio/shared";
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
    outputKind?: OutputKind | string;
    topN?: number;
  }): Promise<RetrievedExamples>;
}

export class SqliteExampleRetriever implements ExampleRetriever {
  constructor(
    private goodRepo = new GoodExampleRepository(),
    private badRepo = new BadExampleRepository()
  ) {}

  async retrieve(input: {
    transcript: string;
    style?: CaptionStyle | string;
    outputKind?: OutputKind | string;
    topN?: number;
  }): Promise<RetrievedExamples> {
    const topN = input.topN ?? config.exampleTopN;
    const outputKind = input.outputKind ?? "x_captions";
    void input.transcript;

    const [good, bad] = await Promise.all([
      this.goodRepo.findRelevant({
        style: input.style,
        limit: topN,
        outputKind,
      }),
      this.badRepo.findTop(Math.min(topN, 4), outputKind),
    ]);

    return { good, bad };
  }
}

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
