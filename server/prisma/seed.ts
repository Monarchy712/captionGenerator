import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const DEFAULT_TEMPLATE = `You are an expert crypto content caption writer for short-form video clips.

Your job is to generate {{count}} high-performing captions for the transcript below.

## RULES
{{rules}}

## WRITING PRINCIPLES
{{principles}}

## SPEAKER CONTEXT
{{speaker_profile}}

## GOOD EXAMPLES
Study these winning captions carefully. Match their cadence, specificity, and hook strength — do not copy them.
{{good_examples}}

## BAD EXAMPLES (AVOID)
Never produce captions like these:
{{bad_examples}}

## STYLE TARGET
Generate captions in the **{{style}}** style for speaker **{{speaker}}**.

## TRANSCRIPT
{{transcript}}

## GENERATION INSTRUCTIONS
1. Produce exactly {{count}} distinct captions.
2. Each caption must stand alone and work as a social post for a short clip.
3. Prefer specificity over hype. Prefer tension over summary.
4. Return ONLY a valid JSON array of strings. No markdown fences. No commentary.
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
        "Match the speaker's cadence and vocabulary. A founder should sound like a founder — not a growth marketer.",
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

  const speakers = [
    {
      name: "Rhea",
      tone: "Sharp, confident, founder energy",
      founderStyle: "Builder-first, opinionated, low fluff",
      technicalDepth: "Medium-high — comfortable with product and market mechanics",
      audience: "Crypto founders, operators, and serious builders",
      writingStyle: "Short sentences. Strong verbs. Minimal hedging.",
      vocabulary: "runway, distribution, product-market fit, conviction, leverage, narrative",
      notes: "Avoid soft motivational language. Prefer decisive framing.",
    },
    {
      name: "Arjun",
      tone: "Analytical, calm, high-signal",
      founderStyle: "Investor-operator hybrid",
      technicalDepth: "High — markets, protocols, incentives",
      audience: "Traders, researchers, crypto-native operators",
      writingStyle: "Precise, slightly dry wit, thesis-driven",
      vocabulary: "asymmetric, incentives, liquidity, reflexivity, edge, regime",
      notes: "Strong when framing second-order effects.",
    },
    {
      name: "Scott",
      tone: "Direct, pragmatic, slightly contrarian",
      founderStyle: "Operator storytelling",
      technicalDepth: "Medium",
      audience: "Operators and crypto Twitter",
      writingStyle: "Punchy, conversational, anti-hype",
      vocabulary: "execution, focus, nonsense, signal, ship, real talk",
      notes: "Works well with blunt one-liners.",
    },
    {
      name: "Anatoly",
      tone: "Technical, understated, high credibility",
      founderStyle: "Protocol founder / systems thinker",
      technicalDepth: "Very high",
      audience: "Engineers, protocol people, serious crypto",
      writingStyle: "Sparse, precise, systems-oriented",
      vocabulary: "throughput, latency, consensus, validators, scaling, architecture",
      notes: "Never oversell. Let technical confidence speak.",
    },
    {
      name: "Other",
      tone: "Neutral professional",
      founderStyle: "Flexible",
      technicalDepth: "Medium",
      audience: "General crypto audience",
      writingStyle: "Clear and punchy",
      vocabulary: "crypto, markets, builders, narrative",
      notes: "Default profile when speaker is unknown.",
    },
  ];

  for (const s of speakers) {
    await prisma.speakerProfile.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  const template = await prisma.promptTemplate.upsert({
    where: { name: "default" },
    update: {},
    create: {
      name: "default",
      content: DEFAULT_TEMPLATE,
      version: 1,
      isActive: true,
    },
  });

  const versionCount = await prisma.promptTemplateVersion.count({
    where: { templateId: template.id },
  });
  if (versionCount === 0) {
    await prisma.promptTemplateVersion.create({
      data: {
        templateId: template.id,
        content: DEFAULT_TEMPLATE,
        version: 1,
      },
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
            "The tech changed.\nThe incentives changed.\nYour attention span didn't.",
          category: "markets",
          tags: JSON.stringify(["cycle", "attention", "contrarian"]),
          speaker: "Arjun",
          style: "Contrarian",
        },
        {
          transcript:
            "Most founders obsess over product and then wonder why nobody shows up. Distribution isn't a department. It's the product strategy.",
          caption:
            "Your product isn't the product.\nDistribution is.",
          category: "founders",
          tags: JSON.stringify(["distribution", "founders"]),
          speaker: "Rhea",
          style: "Founder",
        },
        {
          transcript:
            "Solana's bet was never just speed. It was whether you can keep the whole state coherent while pushing throughput that actually feels like the internet.",
          caption:
            "Speed was never the point.\nCoherent state at internet scale was.",
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
          speaker: "Scott",
          style: "Educational",
        },
        {
          transcript:
            "If your growth strategy is hoping Twitter algorithm loves you, you don't have a growth strategy. You have a wish.",
          caption:
            "Hoping the algorithm saves you\nisn't a growth strategy.",
          category: "founders",
          tags: JSON.stringify(["growth", "viral"]),
          speaker: "Rhea",
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
