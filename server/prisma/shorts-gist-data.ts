/** Shorts Gist — good examples. One-liner distillations of the same transcripts used for X Captions. */
export const SHORTS_GIST_GOOD_EXAMPLES = [
  {
    transcript: [
      "00:00 Volume is the easiest thing to fake on an exchange,",
      "00:04 because you and I can just trade back and forth at the same exact price",
      "00:08 an infinite number of times, and that counts as volume.",
      "00:12 So I actually don't even look at volume as that interesting.",
      "00:16 Here are the things I do look at.",
      "00:18 One, net trading fees paid, after you subtract any rebates or anything else,",
      "00:23 because that is an actual expense that is being incurred.",
      "00:27 The second thing I look at is open interest,",
      "00:30 because open interest requires you to leave capital on the platform",
      "00:34 and have some amount of leverage that you can manage against that capital.",
      "00:39 Liquidations explicitly carry a liquidation penalty that cannot be faked.",
      "00:44 And so I think the liquidation data is the truest source of seeing",
      "00:48 are there real users and are they taking directional risk on your platform.",
    ].join("\n"),
    caption:
      "Tushar Jain ignores exchange volume entirely — net fees, open interest, and liquidations are the only metrics that can't be faked.",
    category: "market analysis",
    tags: JSON.stringify(["multicoin", "exchange", "volume", "on-chain data"]),
    speaker: "Tushar Jain",
    style: "Viral",
  },
  {
    transcript: [
      "00:00 Compliance is highly nuanced, right?",
      "00:03 It's actually not a single thing.",
      "00:06 And I think it's like, if you look back in 2021, 2022,",
      "00:10 there were some organizations that were like,",
      "00:13 oh, we're going to build compliance for crypto.",
      "00:16 But really what they built was they just said it's KYC systems.",
      "00:20 It's actually incorrect because KYC is not necessarily required",
      "00:24 for every type of financial activity.",
      "00:27 It's a whole spectrum.",
      "00:29 Organizations and ecosystems actually don't want stolen funds",
      "00:33 from North Korea going through their system.",
      "00:36 So there is a full spectrum to it.",
    ].join("\n"),
    caption:
      "Nikhil says most crypto compliance tools built in 2021 only did KYC — which isn't even required for every financial activity.",
    category: "regulation & compliance",
    tags: JSON.stringify(["predicate", "defi", "kyc", "compliance"]),
    speaker: "Nikhil Raghuveera",
    style: "Viral",
  },
  {
    transcript: [
      "00:00 You can tokenize anything.",
      "00:02 You know, we went through the whole tokenization sprint",
      "00:05 back from 2014 to 2020-ish,",
      "00:08 where we were just tokenizing everything.",
      "00:11 People were tokenizing their birth certificates.",
      "00:14 They're tokenizing everything.",
      "00:16 Getting it on chain is a great first step,",
      "00:19 but the real use case that's actually going to drive user adoption",
      "00:23 is not quite there yet.",
    ].join("\n"),
    caption:
      "Ben says the 2014–2020 tokenize-everything era already failed — putting things on-chain was never the hard part.",
    category: "tokenization",
    tags: JSON.stringify(["solstice", "rwa", "tokenization"]),
    speaker: "Ben",
    style: "Viral",
  },
  {
    transcript: [
      "00:00 Now, he always said never sell your Bitcoin.",
      "00:03 That was the motto that he lived by.",
      "00:06 And then, of course, it changed from,",
      "00:09 I never said I'm not going to sell our Bitcoin.",
      "00:12 You should just never sell your Bitcoin.",
      "00:15 So now, obviously, selling some of Strategy's Bitcoin.",
    ].join("\n"),
    caption:
      "Scott Melker points out Saylor quietly moved from \"never sell your Bitcoin\" to \"I never said I wouldn't sell ours.\"",
    category: "market analysis",
    tags: JSON.stringify(["bitcoin", "saylor", "strategy"]),
    speaker: "Scott Melker",
    style: "Viral",
  },
  {
    transcript: [
      "00:00 The thesis is super simple.",
      "00:02 The collectible market is a $500 billion market —",
      "00:06 take all the collectibles in the world and put a market cap on it,",
      "00:10 it's give or take half a trillion dollars.",
      "00:13 The NFT market cap within that is about 1%, maybe a little less.",
      "00:18 Digital collectibles have a slew of pros physical ones don't have.",
      "00:22 So you have to ask: if the collectible market is that big,",
      "00:26 do digital collectibles warrant more than a 1% capture,",
      "00:30 with clear pros physical ones don't have?",
      "00:33 The answer is unequivocally yes.",
      "00:36 There's a spread, and room to capture,",
      "00:39 in the tens of billions of dollars.",
    ].join("\n"),
    caption:
      "Luca Netz: digital collectibles hold just 1% of a $500B market — the upside is tens of billions.",
    category: "nfts & collectibles",
    tags: JSON.stringify(["pudgy penguins", "nfts", "collectibles"]),
    speaker: "Luca Netz",
    style: "Viral",
  },
];

/** Shorts Gist — bad examples. */
export const SHORTS_GIST_BAD_EXAMPLES = [
  {
    caption: "Tushar Jain shares some interesting thoughts on exchange metrics",
    reason:
      "Too vague — doesn't say WHAT the insight is. A gist must contain the actual takeaway, not announce that one exists.",
  },
  {
    caption:
      "Compliance is more complicated than you think, and this clip explains everything you need to know about it in crypto",
    reason:
      "Way too long (23 words) and uses engagement bait ('more complicated than you think'). A gist is one tight sentence.",
  },
  {
    caption: "Great take on tokenization from Ben",
    reason:
      "Zero specificity — doesn't mention what the take IS. Reader learns nothing without clicking.",
  },
  {
    caption:
      "Saylor changed his mind. Melker notices. Bitcoin gets sold. The whole narrative shifts overnight and nobody seems to care.",
    reason:
      "Multiple sentences and dramatic filler. A gist is ONE sentence that captures the core fact.",
  },
  {
    caption: "NFTs might be undervalued according to this speaker",
    reason:
      "Omits the $500B / 1% data point that IS the insight. Uses 'this speaker' instead of naming Luca Netz. Vague hedge ('might be').",
  },
];
