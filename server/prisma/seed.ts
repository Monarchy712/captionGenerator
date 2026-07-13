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
2. Each caption must stand alone and work as a social post for a short clip.
3. Prefer specificity over hype. Prefer tension over summary.
4. Mention {{speaker}} when attribution helps — do not invent a fixed persona for them.
5. Return ONLY a valid JSON array of strings. No markdown fences. No commentary.
Example format: ["caption one","caption two","caption three"]`;

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

  const existingRules = await prisma.rule.count();
  if (existingRules === 0) {
    await prisma.rule.createMany({
      data: rules.map((content, i) => ({ content, sortOrder: i, isActive: true })),
    });
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
      })),
    });
  }

  // Speaker profiles removed — guests are free-text names entered per generation.

  let template = await prisma.promptTemplate.findUnique({ where: { name: "default" } });
  if (!template) {
    template = await prisma.promptTemplate.create({
      data: {
        name: "default",
        content: DEFAULT_TEMPLATE,
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

  const goodCount = await prisma.goodExample.count();
  if (goodCount === 0) {
    await prisma.goodExample.createMany({
      data: [
        {
          transcript:
            "People keep asking me if this cycle is different. The technology is different. The incentives are different. The attention span definitely isn't.",
          caption:
            "Arjun on this cycle:\nThe tech changed.\nThe incentives changed.\nYour attention span didn't.",
          category: "markets",
          tags: JSON.stringify(["cycle", "attention", "contrarian"]),
          speaker: "Arjun",
          style: "Contrarian",
        },
        {
          transcript:
            "Most founders obsess over product and then wonder why nobody shows up. Distribution isn't a department. It's the product strategy.",
          caption:
            "Rhea:\nYour product isn't the product.\nDistribution is.",
          category: "founders",
          tags: JSON.stringify(["distribution", "founders"]),
          speaker: "Rhea",
          style: "Founder",
        },
        {
          transcript:
            "Solana's bet was never just speed. It was whether you can keep the whole state coherent while pushing throughput that actually feels like the internet.",
          caption:
            "Anatoly on Solana:\nSpeed was never the point.\nCoherent state at internet scale was.",
          category: "technical",
          tags: JSON.stringify(["solana", "throughput"]),
          speaker: "Anatoly",
          style: "Technical",
        },
        {
          transcript:
            "Everyone wants asymmetric upside until they realize it comes with asymmetric boredom, waiting, and looking stupid in public.",
          caption:
            "Asymmetric upside requires asymmetric patience.\nMost people only signed up for the first half.",
          category: "markets",
          tags: JSON.stringify(["patience", "edge"]),
          speaker: "Guest",
          style: "Educational",
        },
        {
          transcript:
            "If your growth strategy is hoping Twitter algorithm loves you, you don't have a growth strategy. You have a wish.",
          caption:
            "Hoping the algorithm saves you\nisn't a growth strategy.",
          category: "founders",
          tags: JSON.stringify(["growth", "viral"]),
          speaker: "Guest",
          style: "Viral",
        },
      ],
    });
  }

  const badCount = await prisma.badExample.count();
  if (badCount === 0) {
    await prisma.badExample.createMany({
      data: [
        {
          caption: "This is a must-watch! You won't believe what happens next 🔥🔥🔥",
          reason: "Generic engagement bait with emoji spam and zero substance.",
        },
        {
          caption: "Watch till the end for the big reveal!",
          reason: "Explicitly forbidden phrase; manipulative and low-signal.",
        },
        {
          caption:
            "In this clip, the speaker discusses various important topics related to cryptocurrency markets and provides insightful commentary.",
          reason: "Pure summary. No hook, no tension, no voice.",
        },
        {
          caption: "Absolutely incredible groundbreaking paradigm shift that changes everything forever!!!",
          reason: "Empty hype. No specificity. Sounds like spam.",
        },
      ],
    });
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
