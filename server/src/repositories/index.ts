import prisma from "../database/prisma";
import { parseJsonArray, toJsonArray } from "../utils/helpers";

export class RuleRepository {
  async findAll(activeOnly = false, outputKind?: string) {
    return prisma.rule.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(outputKind ? { outputKind } : {}),
      },
      orderBy: [{ outputKind: "asc" }, { sortOrder: "asc" }],
    });
  }

  async create(data: {
    content: string;
    outputKind?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return prisma.rule.create({
      data: {
        content: data.content,
        outputKind: data.outputKind ?? "x_captions",
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{ content: string; outputKind: string; sortOrder: number; isActive: boolean }>
  ) {
    return prisma.rule.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.rule.delete({ where: { id } });
  }

  async replaceAll(
    outputKind: string,
    rules: { content: string; sortOrder: number; isActive?: boolean }[]
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.rule.deleteMany({ where: { outputKind } });
      if (rules.length === 0) return [];
      await tx.rule.createMany({
        data: rules.map((r) => ({
          content: r.content,
          sortOrder: r.sortOrder,
          isActive: r.isActive ?? true,
          outputKind,
        })),
      });
      return tx.rule.findMany({
        where: { outputKind },
        orderBy: { sortOrder: "asc" },
      });
    });
  }
}

export class WritingPrincipleRepository {
  async findAll(activeOnly = false) {
    return prisma.writingPrinciple.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
  }

  async create(data: { title: string; content: string; sortOrder?: number; isActive?: boolean }) {
    return prisma.writingPrinciple.create({ data });
  }

  async update(
    id: string,
    data: Partial<{ title: string; content: string; sortOrder: number; isActive: boolean }>
  ) {
    return prisma.writingPrinciple.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.writingPrinciple.delete({ where: { id } });
  }
}

export class PromptTemplateRepository {
  async findActive() {
    return prisma.promptTemplate.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findByName(name: string) {
    return prisma.promptTemplate.findUnique({ where: { name } });
  }

  async findById(id: string) {
    return prisma.promptTemplate.findUnique({ where: { id } });
  }

  async update(id: string, content: string) {
    const current = await prisma.promptTemplate.findUniqueOrThrow({ where: { id } });
    const nextVersion = current.version + 1;

    return prisma.$transaction(async (tx) => {
      await tx.promptTemplateVersion.create({
        data: {
          templateId: id,
          content,
          version: nextVersion,
        },
      });
      return tx.promptTemplate.update({
        where: { id },
        data: { content, version: nextVersion },
      });
    });
  }

  async getVersions(templateId: string) {
    return prisma.promptTemplateVersion.findMany({
      where: { templateId },
      orderBy: { version: "desc" },
    });
  }

  async revertToVersion(templateId: string, version: number) {
    const snapshot = await prisma.promptTemplateVersion.findFirst({
      where: { templateId, version },
    });
    if (!snapshot) throw new Error(`Version ${version} not found`);
    return this.update(templateId, snapshot.content);
  }
}

export class GoodExampleRepository {
  async findAll(filters?: { style?: string; category?: string; activeOnly?: boolean }) {
    const rows = await prisma.goodExample.findMany({
      where: {
        isActive: filters?.activeOnly ? true : undefined,
        style: filters?.style,
        category: filters?.category,
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({ ...r, tags: parseJsonArray(r.tags) }));
  }

  async findRelevant(opts: { style?: string; limit: number }) {
    // Prefer matching style, then fall back to recent active examples.
    // Guest name is optional metadata only — never used for retrieval.
    const matched = opts.style
      ? await prisma.goodExample.findMany({
          where: { isActive: true, style: opts.style },
          orderBy: { updatedAt: "desc" },
          take: opts.limit,
        })
      : [];

    if (matched.length >= opts.limit) {
      return matched.slice(0, opts.limit).map((r) => ({ ...r, tags: parseJsonArray(r.tags) }));
    }

    const remaining = opts.limit - matched.length;
    const ids = matched.map((m) => m.id);
    const fallback = await prisma.goodExample.findMany({
      where: { isActive: true, id: { notIn: ids } },
      orderBy: { updatedAt: "desc" },
      take: remaining,
    });

    return [...matched, ...fallback].map((r) => ({ ...r, tags: parseJsonArray(r.tags) }));
  }

  async create(data: {
    transcript: string;
    caption: string;
    category?: string;
    tags?: string[];
    speaker?: string;
    style?: string;
    isActive?: boolean;
  }) {
    const row = await prisma.goodExample.create({
      data: {
        transcript: data.transcript,
        caption: data.caption,
        category: data.category ?? "general",
        tags: toJsonArray(data.tags ?? []),
        speaker: data.speaker?.trim() || "",
        style: data.style,
        isActive: data.isActive ?? true,
      },
    });
    return { ...row, tags: parseJsonArray(row.tags) };
  }

  async update(
    id: string,
    data: Partial<{
      transcript: string;
      caption: string;
      category: string;
      tags: string[];
      speaker: string;
      style: string | null;
      isActive: boolean;
    }>
  ) {
    const { tags, ...rest } = data;
    const row = await prisma.goodExample.update({
      where: { id },
      data: {
        ...rest,
        ...(tags !== undefined ? { tags: toJsonArray(tags) } : {}),
      },
    });
    return { ...row, tags: parseJsonArray(row.tags) };
  }

  async delete(id: string) {
    return prisma.goodExample.delete({ where: { id } });
  }
}

export class BadExampleRepository {
  async findAll(activeOnly = false) {
    return prisma.badExample.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findTop(limit: number) {
    return prisma.badExample.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  async create(data: { caption: string; reason: string; isActive?: boolean }) {
    return prisma.badExample.create({ data });
  }

  async update(id: string, data: Partial<{ caption: string; reason: string; isActive: boolean }>) {
    return prisma.badExample.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.badExample.delete({ where: { id } });
  }
}

export class SpeakerRepository {
  async findAll(activeOnly = false) {
    return prisma.speakerProfile.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
  }

  async findByName(name: string) {
    return prisma.speakerProfile.findUnique({ where: { name } });
  }

  async create(data: {
    name: string;
    tone: string;
    founderStyle?: string;
    technicalDepth: string;
    audience: string;
    writingStyle: string;
    vocabulary: string;
    notes?: string;
    isActive?: boolean;
  }) {
    return prisma.speakerProfile.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      tone: string;
      founderStyle: string;
      technicalDepth: string;
      audience: string;
      writingStyle: string;
      vocabulary: string;
      notes: string | null;
      isActive: boolean;
    }>
  ) {
    return prisma.speakerProfile.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.speakerProfile.delete({ where: { id } });
  }
}

export class TranscriptRepository {
  async create(data: { content: string; speaker?: string; style?: string }) {
    return prisma.transcript.create({ data });
  }

  async findById(id: string) {
    return prisma.transcript.findUnique({
      where: { id },
      include: { captions: true },
    });
  }
}

export class CaptionRepository {
  async createMany(
    items: {
      transcriptId: string;
      originalText: string;
      speaker?: string;
      style?: string;
      outputKind?: string;
    }[]
  ) {
    const created = [];
    for (const item of items) {
      const caption = await prisma.generatedCaption.create({
        data: {
          transcriptId: item.transcriptId,
          originalText: item.originalText,
          finalText: item.originalText,
          speaker: item.speaker,
          style: item.style,
          outputKind: item.outputKind ?? "x_captions",
          version: 1,
        },
      });
      await prisma.captionVersion.create({
        data: {
          captionId: caption.id,
          text: item.originalText,
          version: 1,
          source: "ai",
        },
      });
      created.push(caption);
    }
    return created;
  }

  async findById(id: string) {
    return prisma.generatedCaption.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: "desc" } }, feedback: true },
    });
  }

  async markUsed(id: string) {
    return prisma.generatedCaption.update({
      where: { id },
      data: { isUsed: true },
    });
  }

  async applyEdit(id: string, editedText: string) {
    const current = await prisma.generatedCaption.findUniqueOrThrow({ where: { id } });
    const nextVersion = current.version + 1;

    return prisma.$transaction(async (tx) => {
      await tx.captionVersion.create({
        data: {
          captionId: id,
          text: editedText,
          version: nextVersion,
          source: "edit",
        },
      });
      return tx.generatedCaption.update({
        where: { id },
        data: {
          editedText,
          finalText: editedText,
          version: nextVersion,
        },
      });
    });
  }
}

export class FeedbackRepository {
  async create(data: { captionId: string; type: string; note?: string }) {
    return prisma.feedback.create({ data });
  }

  async findByCaption(captionId: string) {
    return prisma.feedback.findMany({
      where: { captionId },
      orderBy: { createdAt: "desc" },
    });
  }
}
