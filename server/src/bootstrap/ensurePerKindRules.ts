import prisma from "../database/prisma";

function isWordLimitRule(content: string): boolean {
  return (
    /\b\d+\s*[–\-]\s*\d+\s*words?\b/i.test(content) ||
    /\b(?:maximum|max|not more than|at most|up to)\s+\d+\s*words?\b/i.test(content) ||
    /\b\d+\s*words?\s*max(?:imum)?\b/i.test(content)
  );
}

/**
 * After scoping the knowledge base by outputKind, ensure Shorts modes
 * have rules / principles / templates (examples stay empty until admin fills).
 */
export async function ensurePerKindRules(): Promise<void> {
  for (const kind of ["shorts_title", "shorts_caption", "shorts_gist"] as const) {
    // Rules
    const ruleCount = await prisma.rule.count({ where: { outputKind: kind } });
    if (ruleCount === 0) {
      const source = await prisma.rule.findMany({
        where: { outputKind: "x_captions", isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      const filtered = source.filter((r) => !isWordLimitRule(r.content));
      if (filtered.length > 0) {
        await prisma.rule.createMany({
          data: filtered.map((r, i) => ({
            content: r.content,
            sortOrder: i,
            isActive: true,
            outputKind: kind,
          })),
        });
        console.log(`[bootstrap] Copied ${filtered.length} rules → ${kind}`);
      }
    }

    // Principles
    const principleCount = await prisma.writingPrinciple.count({ where: { outputKind: kind } });
    if (principleCount === 0) {
      const source = await prisma.writingPrinciple.findMany({
        where: { outputKind: "x_captions", isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      if (source.length > 0) {
        await prisma.writingPrinciple.createMany({
          data: source.map((p, i) => ({
            title: p.title,
            content: p.content,
            sortOrder: i,
            isActive: true,
            outputKind: kind,
          })),
        });
        console.log(`[bootstrap] Copied ${source.length} principles → ${kind}`);
      }
    }

    // Prompt template
    const template = await prisma.promptTemplate.findUnique({ where: { outputKind: kind } });
    if (!template) {
      const source = await prisma.promptTemplate.findUnique({
        where: { outputKind: "x_captions" },
      });
      if (source) {
        const created = await prisma.promptTemplate.create({
          data: {
            name: "default",
            content: source.content,
            outputKind: kind,
            version: 1,
            isActive: true,
          },
        });
        await prisma.promptTemplateVersion.create({
          data: { templateId: created.id, content: source.content, version: 1 },
        });
        console.log(`[bootstrap] Copied prompt template → ${kind}`);
      }
    }
  }
}
