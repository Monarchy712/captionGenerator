-- AlterTable WritingPrinciple
ALTER TABLE "WritingPrinciple" ADD COLUMN "outputKind" TEXT NOT NULL DEFAULT 'x_captions';
CREATE INDEX "WritingPrinciple_outputKind_idx" ON "WritingPrinciple"("outputKind");

-- AlterTable GoodExample
ALTER TABLE "GoodExample" ADD COLUMN "outputKind" TEXT NOT NULL DEFAULT 'x_captions';
CREATE INDEX "GoodExample_outputKind_idx" ON "GoodExample"("outputKind");

-- AlterTable BadExample
ALTER TABLE "BadExample" ADD COLUMN "outputKind" TEXT NOT NULL DEFAULT 'x_captions';
CREATE INDEX "BadExample_outputKind_idx" ON "BadExample"("outputKind");

-- AlterTable PromptTemplate: one active template per output kind
ALTER TABLE "PromptTemplate" ADD COLUMN "outputKind" TEXT NOT NULL DEFAULT 'x_captions';
DROP INDEX IF EXISTS "PromptTemplate_name_key";
CREATE UNIQUE INDEX "PromptTemplate_outputKind_key" ON "PromptTemplate"("outputKind");
