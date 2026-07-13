/** Fresh bad examples — caption + why it's bad. Guest/style/tags are not stored. */
export const FRESH_BAD_EXAMPLES = [
  {
    caption: [
      "Tushar Jain reveals the secret metric everyone's ignoring, watch till the end.",
      "Tushar Jain from Multicoin, on volume",
      '"Volume is the easiest thing to fake."',
    ].join("\n"),
    reason:
      "Violates: rule 3 (period inside the hook), rule 11 (banned \"watch till the end\"), rule 5 (attribution line drops the \"[Name] from [org], on why [thesis]\" format), rule 6 (only 1 quote instead of 3–4).",
  },
  {
    caption: [
      "this changes everything about how compliance works in crypto",
      "Nikhil says compliance is complicated",
      '"Nikhil basically says KYC isn\'t always needed and that there\'s a whole range of rules depending on the situation."',
      '"He also mentions that stolen funds from bad actors are a problem."',
    ].join("\n"),
    reason:
      "Violates: rule 12 (banned \"this changes everything\"), rule 1 (quotes are paraphrased summaries, not verbatim), rule 5 (attribution line skips the required format entirely).",
  },
  {
    caption: [
      "Ben From Solstice Drops An Incredible Truth Bomb — You Won't Believe It",
      "Ben From Solstice, On Why Tokenization Is Amazing",
      '"You can tokenize anything."',
      '"People were tokenizing their birth certificates."',
    ].join("\n"),
    reason:
      "Violates: rule 7 (title case throughout instead of sentence case), rule 8 (em dash in the hook), rule 10 (generic hype — \"incredible truth bomb,\" \"amazing\"), rule 12 (banned \"you won't believe\").",
  },
  {
    caption: [
      "scott melker breaks down how michael saylor's entire philosophy on holding bitcoin forever has quietly evolved over the past year",
      "Scott Melker from The Daily Wolf, on Saylor's changing Bitcoin stance",
      '"He always said, never sell your Bitcoin."',
      '"That was the motto that he lived by."',
      '"I never said I\'m not going to sell our Bitcoin."',
      '"You should just never sell your Bitcoin."',
      '"Now, obviously, selling some of Strategy\'s Bitcoin."',
    ].join("\n"),
    reason:
      "Violates: rule 3 (hook runs ~19 words, over the 10–15 limit), rule 6 (5 fragmented quotes instead of 3–4 combined ones — chops one continuous quote into disconnected shards).",
  },
  {
    caption: [
      "someone drops major insight on why nfts still matter today",
      "A speaker on Market Bubble, on collectibles",
      '"The collectible market is a big market."',
      '"NFTs still have a small piece of it."',
      '"There\'s a lot of room to grow."',
    ].join("\n"),
    reason:
      "Violates: rule 15 (speaker left unnamed even though identifiable in source), rule 13 (vague language — \"major insight,\" \"still matter\" — instead of the actual $500B/1% figures), rule 1 (quotes are paraphrased/rounded down instead of verbatim numbers).",
  },
];
