-- CreateSchema
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingPrinciple" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingPrinciple_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromptTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptTemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoodExample" (
    "id" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "speaker" TEXT NOT NULL DEFAULT '',
    "style" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodExample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BadExample" (
    "id" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadExample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpeakerProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "founderStyle" TEXT NOT NULL DEFAULT '',
    "technicalDepth" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "writingStyle" TEXT NOT NULL,
    "vocabulary" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "speaker" TEXT,
    "style" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedCaption" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "editedText" TEXT,
    "finalText" TEXT NOT NULL,
    "speaker" TEXT,
    "style" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedCaption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaptionVersion" (
    "id" TEXT NOT NULL,
    "captionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaptionVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "captionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "PromptTemplate_name_key" ON "PromptTemplate"("name");
CREATE UNIQUE INDEX "SpeakerProfile_name_key" ON "SpeakerProfile"("name");
CREATE INDEX "PromptTemplateVersion_templateId_idx" ON "PromptTemplateVersion"("templateId");
CREATE INDEX "GeneratedCaption_transcriptId_idx" ON "GeneratedCaption"("transcriptId");
CREATE INDEX "CaptionVersion_captionId_idx" ON "CaptionVersion"("captionId");
CREATE INDEX "Feedback_captionId_idx" ON "Feedback"("captionId");

ALTER TABLE "PromptTemplateVersion" ADD CONSTRAINT "PromptTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedCaption" ADD CONSTRAINT "GeneratedCaption_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaptionVersion" ADD CONSTRAINT "CaptionVersion_captionId_fkey" FOREIGN KEY ("captionId") REFERENCES "GeneratedCaption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_captionId_fkey" FOREIGN KEY ("captionId") REFERENCES "GeneratedCaption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
