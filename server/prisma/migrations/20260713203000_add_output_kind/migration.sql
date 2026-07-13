-- AlterTable
ALTER TABLE "GeneratedCaption" ADD COLUMN "outputKind" TEXT NOT NULL DEFAULT 'x_captions';

-- CreateIndex
CREATE INDEX "GeneratedCaption_outputKind_idx" ON "GeneratedCaption"("outputKind");
