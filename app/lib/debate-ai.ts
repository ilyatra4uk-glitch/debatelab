import type { DebateRecord, DebateScore, DebateTurn } from "./debate-types";

type JudgePayload = Omit<DebateScore, "id" | "debateId" | "userId" | "createdAt">;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export async function generateBotReply(
  debate: DebateRecord,
  userArgument: string,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackBotReply(debate, userArgument);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content:
            "You are a concise debate sparring partner. Reply with one opposing argument and one direct rebuttal in under 120 words.",
        },
        {
          role: "user",
          content: `Motion: ${debate.motion}\nUser side: ${debate.side}\nUser argument: ${userArgument}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallbackBotReply(debate, userArgument);
  }

  const data = (await response.json()) as { output_text?: string };
  return data.output_text?.trim() || fallbackBotReply(debate, userArgument);
}

export async function judgeDebate(
  debate: DebateRecord,
  turns: DebateTurn[],
): Promise<JudgePayload> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackJudge(debate, turns);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      text: {
        format: {
          type: "json_schema",
          name: "debate_score",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              structure: { type: "integer", minimum: 1, maximum: 10 },
              logic: { type: "integer", minimum: 1, maximum: 10 },
              evidence: { type: "integer", minimum: 1, maximum: 10 },
              rebuttal: { type: "integer", minimum: 1, maximum: 10 },
              speakingStyle: { type: "integer", minimum: 1, maximum: 10 },
              overall: { type: "integer", minimum: 1, maximum: 100 },
              rank: { type: "string" },
              feedback: { type: "string" },
            },
            required: [
              "structure",
              "logic",
              "evidence",
              "rebuttal",
              "speakingStyle",
              "overall",
              "rank",
              "feedback",
            ],
          },
        },
      },
      input: [
        {
          role: "system",
          content:
            "Judge the user's debate performance. Be fair, specific, and return only the requested JSON object.",
        },
        {
          role: "user",
          content: `Motion: ${debate.motion}\nUser side: ${debate.side}\nTurns:\n${turns
            .map((turn) => `${turn.speaker}: ${turn.content}`)
            .join("\n\n")}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("AI judge failed. Try again in a moment.");
  }

  const data = (await response.json()) as { output_text?: string };
  return parseJudgePayload(data.output_text);
}

function parseJudgePayload(value: string | undefined): JudgePayload {
  if (!value) {
    throw new Error("AI judge returned an empty result.");
  }

  const parsed = JSON.parse(value) as Partial<JudgePayload>;
  const required: Array<keyof JudgePayload> = [
    "structure",
    "logic",
    "evidence",
    "rebuttal",
    "speakingStyle",
    "overall",
    "rank",
    "feedback",
  ];

  for (const key of required) {
    if (parsed[key] === undefined || parsed[key] === null) {
      throw new Error("AI judge returned an incomplete result.");
    }
  }

  return {
    structure: clampScore(parsed.structure),
    logic: clampScore(parsed.logic),
    evidence: clampScore(parsed.evidence),
    rebuttal: clampScore(parsed.rebuttal),
    speakingStyle: clampScore(parsed.speakingStyle),
    overall: clampOverall(parsed.overall),
    rank: String(parsed.rank),
    feedback: String(parsed.feedback),
  };
}

function fallbackBotReply(debate: DebateRecord, userArgument: string): string {
  const opposingSide = debate.side === "for" ? "against" : "for";
  const hasEvidence = /\d|study|data|because|example/i.test(userArgument);

  return `I will argue ${opposingSide}. Your case is clear, but it needs stronger comparative weighing. The biggest challenge is proving that your impact is larger than the alternative. ${hasEvidence ? "Your evidence helps, so I would attack whether it is representative." : "I would press you for a concrete example or data point."}`;
}

function fallbackJudge(debate: DebateRecord, turns: DebateTurn[]): JudgePayload {
  const userWords = turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => turn.content)
    .join(" ");
  const wordCount = userWords.split(/\s+/).filter(Boolean).length;
  const hasEvidence = /\d|study|data|example|for instance/i.test(userWords);
  const hasRebuttal = /however|but|respond|rebut|their|opponent/i.test(userWords);
  const structure = wordCount > 60 ? 7 : 6;
  const evidence = hasEvidence ? 7 : 5;
  const rebuttal = hasRebuttal ? 7 : 5;
  const logic = userWords.includes("because") ? 7 : 6;
  const speakingStyle = wordCount > 25 ? 7 : 6;
  const overall = Math.round(
    ((structure + evidence + rebuttal + logic + speakingStyle) / 50) * 100,
  );

  return {
    structure,
    logic,
    evidence,
    rebuttal,
    speakingStyle,
    overall,
    rank: overall >= 80 ? "Gold III" : overall >= 65 ? "Silver II" : "Bronze I",
    feedback: `On "${debate.motion}", your ${debate.side} case has a usable core. Next, add one concrete example and compare why your impact matters more than the bot's response.`,
  };
}

function clampScore(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 1;
  return Math.max(1, Math.min(10, Math.round(numberValue)));
}

function clampOverall(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 1;
  return Math.max(1, Math.min(100, Math.round(numberValue)));
}
