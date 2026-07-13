import prisma from "../database/prisma";

/** Word-limit rules are omitted when bootstrapping Shorts rule sets from X Captions. */
function isWordLimitRule(content: string): boolean {
  return (
    /\b\d+\s*[–\-]\s*\d+\s*words?\b/i.test(content) ||
    /\b(?:maximum|max|not more than|at most|up to)\s+\d+\s*words?\b/i.test(content) ||
    /\b\d+\s*words?\s*max(?:imum)?\b/i.test(content)
  );
}

/**
 * After adding Rule.outputKind, copy X Captions rules into Shorts sections
 * (skipping word-count rules) when those sections are still empty.
 */
export async function ensurePerKindRules(): Promise<void> {
  for (const kind of ["shorts_title", "shorts_caption"] as const) {
    const count = await prisma.rule.count({ where: { outputKind: kind } });
    if (count > 0) continue;

    const source = await prisma.rule.findMany({
      where: { outputKind: "x_captions", isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    const filtered = source.filter((r) => !isWordLimitRule(r.content));
    if (filtered.length === 0) continue;

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
