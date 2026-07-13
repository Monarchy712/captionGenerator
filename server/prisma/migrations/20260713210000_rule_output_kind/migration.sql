-- AlterTable
ALTER TABLE "Rule" ADD COLUMN "outputKind" TEXT NOT NULL DEFAULT 'x_captions';

-- CreateIndex
CREATE INDEX "Rule_outputKind_idx" ON "Rule"("outputKind");
