import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const DEFAULT_TEMPLATE = `You are an expert crypto content caption writer for short-form video clips from podcasts and interviews.

Your job is to generate {{count}} high-performing captions for the transcript below.

## RULES
{{rules}}

## WRITING PRINCIPLES
{{principles}}

## GUEST / SPEAKER
{{speaker_profile}}

## GOOD EXAMPLES
Study these winning captions carefully. Match their cadence, specificity, and hook strength — do not copy them.
{{good_examples}}

## BAD EXAMPLES (AVOID)
Never produce captions like these:
{{bad_examples}}

## STYLE TARGET
Generate captions in the **{{style}}** style.
When natural, mention the guest **{{speaker}}** by name in the caption.

## TRANSCRIPT
{{transcript}}

## GENERATION INSTRUCTIONS
1. Produce exactly {{count}} distinct captions.
2. Each caption MUST be a FULL multi-line block matching the good-example structure (hook + attribution + quotes) — NEVER a one-liner.
3. Prefer specificity over hype. Prefer tension over summary.
4. Mention {{speaker}} when attribution helps — do not invent a fixed persona for them.
5. Output format (critical): separate captions with the delimiter line <<<CAPTION>>>
   Do NOT return JSON. Do NOT wrap in markdown fences. Do NOT add commentary.

Example output shape:
<<<CAPTION>>>
hook line goes here without a trailing period

Name from Org, on why thesis

"verbatim quote one"
"verbatim quote two"
"verbatim quote three"
<<<CAPTION>>>
second full multi-line caption
...`;

async function main() {
  console.log("Seeding Caption Studio database...");

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "caption-studio-admin"),
      role: "admin",
    },
  });

  const rules = [
    "Never summarize the transcript.",
    "Maximum 35 words per caption.",
    "The first line must stand alone as a hook.",
    "Avoid generic hype and empty superlatives.",
    'Never say "Watch till the end."',
    "Never use engagement bait like \"You won't believe\" or \"This changes everything.\"",
    "Prefer concrete claims, numbers, names, and tension over vague inspiration.",
    "Write for scroll-stopping first impressions — the caption is the product.",
  ];

  const isWordLimitRule = (content: string) =>
    /\b\d+\s*[–\-]\s*\d+\s*words?\b/i.test(content) ||
    /\b(?:maximum|max|not more than|at most|up to)\s+\d+\s*words?\b/i.test(content) ||
    /\b\d+\s*words?\s*max(?:imum)?\b/i.test(content);

  const existingRules = await prisma.rule.count();
  if (existingRules === 0) {
    await prisma.rule.createMany({
      data: rules.map((content, i) => ({
        content,
        sortOrder: i,
        isActive: true,
        outputKind: "x_captions",
      })),
    });
  }

  // Bootstrap Shorts rule sets from X rules (minus word-limit lines) when empty.
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
    console.log(`Bootstrapped ${filtered.length} rules for ${kind}`);
  }

  const principles = [
    {
      title: "Hook First",
      content:
        "Open with tension, contradiction, or a specific claim. The first line must earn the scroll-stop before context appears.",
    },
    {
      title: "Specificity Wins",
      content:
        "Replace vague praise with concrete details: protocols, numbers, tradeoffs, named people, and sharp opinions.",
    },
    {
      title: "Voice Over Formula",
      content:
        "Write in a sharp, crypto-native voice. Guests change episode to episode — attribute them by name when useful, but never invent a fixed persona.",
    },
    {
      title: "Tension Over Summary",
      content:
        "Captions should create unfinished business in the reader's mind. Never flatten the clip into a bland synopsis.",
    },
    {
      title: "Crypto-Native Clarity",
      content:
        "Use accurate crypto language when useful, but never gatekeep. Clarity > jargon stacking.",
    },
  ];

  const existingPrinciples = await prisma.writingPrinciple.count();
  if (existingPrinciples === 0) {
    await prisma.writingPrinciple.createMany({
      data: principles.map((p, i) => ({
        title: p.title,
        content: p.content,
        sortOrder: i,
        isActive: true,
        outputKind: "x_captions",
      })),
    });
  }

  // Speaker profiles removed — guests are free-text names entered per generation.

  let template = await prisma.promptTemplate.findUnique({ where: { outputKind: "x_captions" } });
  if (!template) {
    template = await prisma.promptTemplate.create({
      data: {
        name: "default",
        content: DEFAULT_TEMPLATE,
        outputKind: "x_captions",
        version: 1,
        isActive: true,
      },
    });
    await prisma.promptTemplateVersion.create({
      data: { templateId: template.id, content: DEFAULT_TEMPLATE, version: 1 },
    });
  } else if (template.content !== DEFAULT_TEMPLATE) {
    const nextVersion = template.version + 1;
    await prisma.promptTemplateVersion.create({
      data: { templateId: template.id, content: DEFAULT_TEMPLATE, version: nextVersion },
    });
    template = await prisma.promptTemplate.update({
      where: { id: template.id },
      data: { content: DEFAULT_TEMPLATE, version: nextVersion },
    });
  }

  const goodCount = await prisma.goodExample.count({ where: { outputKind: "x_captions" } });
  if (goodCount === 0) {
    const { FRESH_GOOD_EXAMPLES } = await import("./good-examples-data");
    await prisma.goodExample.createMany({
      data: FRESH_GOOD_EXAMPLES.map((ex) => ({ ...ex, outputKind: "x_captions" })),
    });
  }

  const badCount = await prisma.badExample.count({ where: { outputKind: "x_captions" } });
  if (badCount === 0) {
    const { FRESH_BAD_EXAMPLES } = await import("./bad-examples-data");
    await prisma.badExample.createMany({
      data: FRESH_BAD_EXAMPLES.map((ex) => ({ ...ex, outputKind: "x_captions" })),
    });
  }

  // Bootstrap Shorts principles + templates (examples intentionally empty).
  for (const kind of ["shorts_title", "shorts_caption"] as const) {
    const pCount = await prisma.writingPrinciple.count({ where: { outputKind: kind } });
    if (pCount === 0) {
      const source = await prisma.writingPrinciple.findMany({
        where: { outputKind: "x_captions" },
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
      }
    }
    const t = await prisma.promptTemplate.findUnique({ where: { outputKind: kind } });
    if (!t && template) {
      const created = await prisma.promptTemplate.create({
        data: {
          name: "default",
          content: template.content,
          outputKind: kind,
          version: 1,
          isActive: true,
        },
      });
      await prisma.promptTemplateVersion.create({
        data: { templateId: created.id, content: template.content, version: 1 },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
