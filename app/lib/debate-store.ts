import { promises as fs } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import type { ChatGPTUser } from "../chatgpt-auth";
import type {
  DebateRecord,
  DebateScore,
  DebateSide,
  DebateTurn,
  ProfileStats,
} from "./debate-types";

export type StoredUser = ChatGPTUser & {
  createdAt: string;
  updatedAt: string;
};

type StoreData = {
  users: StoredUser[];
  debates: DebateRecord[];
  turns: DebateTurn[];
  scores: DebateScore[];
  magicLinks: MagicLoginToken[];
};

type MagicLoginToken = {
  id: string;
  email: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};

const emptyStore: StoreData = {
  users: [],
  debates: [],
  turns: [],
  scores: [],
  magicLinks: [],
};

const storePath =
  process.env.DEBATELAB_STORE_PATH ??
  path.join(".debatedata", "store.json");
const tmpStorePath = path.join("/tmp", ".debatedata.json");

let writeQueue = Promise.resolve();
let activeStorePath = storePath;

export async function getOrCreateUser(user: ChatGPTUser): Promise<StoredUser> {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const existing = store.users.find((item) => item.userId === user.userId);

    if (existing) {
      existing.email = user.email;
      existing.displayName = user.displayName;
      existing.fullName = user.fullName;
      existing.updatedAt = now;
      return existing;
    }

    const created = { ...user, createdAt: now, updatedAt: now };
    store.users.push(created);
    return created;
  });
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const store = await readStore();
  const normalizedEmail = email.trim().toLowerCase();

  return (
    store.users.find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

export async function createMagicLoginToken(email: string): Promise<{
  token: string;
  expiresAt: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  await updateStore((store) => {
    store.magicLinks = store.magicLinks.filter((item) => {
      const isExpired = new Date(item.expiresAt).getTime() <= now.getTime();
      const isSameEmail = item.email === normalizedEmail;

      return !isExpired && !(isSameEmail && item.usedAt === null);
    });
    store.magicLinks.push({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      tokenHash: hashMagicToken(token),
      createdAt: now.toISOString(),
      expiresAt,
      usedAt: null,
    });
  });

  return { token, expiresAt };
}

export async function consumeMagicLoginToken(
  token: string,
): Promise<StoredUser | null> {
  const tokenHash = hashMagicToken(token);

  return updateStore((store) => {
    const now = new Date();
    const magicLink = store.magicLinks.find(
      (item) => item.tokenHash === tokenHash && item.usedAt === null,
    );

    if (!magicLink) return null;
    if (new Date(magicLink.expiresAt).getTime() <= now.getTime()) {
      magicLink.usedAt = now.toISOString();
      return null;
    }

    const user = store.users.find(
      (item) => item.email.trim().toLowerCase() === magicLink.email,
    );
    if (!user) return null;

    magicLink.usedAt = now.toISOString();
    user.updatedAt = now.toISOString();
    return user;
  });
}

function hashMagicToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createBotDebate({
  userId,
  motion,
  side,
}: {
  userId: string;
  motion: string;
  side: DebateSide;
}): Promise<DebateRecord> {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const debate: DebateRecord = {
      id: crypto.randomUUID(),
      userId,
      mode: "bot",
      motion,
      side,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    store.debates.push(debate);
    return debate;
  });
}

export async function addDebateTurn({
  debateId,
  speaker,
  content,
}: {
  debateId: string;
  speaker: DebateTurn["speaker"];
  content: string;
}): Promise<DebateTurn> {
  return updateStore((store) => {
    const debate = store.debates.find((item) => item.id === debateId);
    if (!debate) {
      throw new Error("Debate not found.");
    }

    const now = new Date().toISOString();
    const turn: DebateTurn = {
      id: crypto.randomUUID(),
      debateId,
      speaker,
      content,
      createdAt: now,
    };
    debate.updatedAt = now;
    store.turns.push(turn);
    return turn;
  });
}

export async function getDebateForUser(
  debateId: string,
  userId: string,
): Promise<{ debate: DebateRecord; turns: DebateTurn[] }> {
  const store = await readStore();
  const debate = store.debates.find(
    (item) => item.id === debateId && item.userId === userId,
  );

  if (!debate) {
    throw new Error("Debate not found.");
  }

  return {
    debate,
    turns: store.turns
      .filter((turn) => turn.debateId === debate.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export async function saveScore({
  debateId,
  userId,
  score,
}: {
  debateId: string;
  userId: string;
  score: Omit<DebateScore, "id" | "debateId" | "userId" | "createdAt">;
}): Promise<DebateScore> {
  return updateStore((store) => {
    const debate = store.debates.find(
      (item) => item.id === debateId && item.userId === userId,
    );
    if (!debate) {
      throw new Error("Debate not found.");
    }

    const now = new Date().toISOString();
    const saved: DebateScore = {
      id: crypto.randomUUID(),
      debateId,
      userId,
      createdAt: now,
      ...score,
    };
    debate.status = "judged";
    debate.updatedAt = now;
    store.scores = store.scores.filter((item) => item.debateId !== debateId);
    store.scores.push(saved);
    return saved;
  });
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const store = await readStore();
  const debates = store.debates
    .filter((debate) => debate.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const scores = store.scores
    .filter((score) => score.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score.overall, 0) / scores.length)
    : null;
  const scoreHistory = scores.slice(0, 5);
  const recentArguments = store.turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => {
      const debate = store.debates.find(
        (item) => item.id === turn.debateId && item.userId === userId,
      );

      if (!debate) return null;

      return {
        id: turn.id,
        motion: debate.motion,
        content: turn.content,
        createdAt: turn.createdAt,
      };
    })
    .filter((turn): turn is NonNullable<typeof turn> => Boolean(turn))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const weakestSkill = getWeakestSkill(scores);
  const improvementTrend = getImprovementTrend(scores);

  return {
    debateCount: debates.length,
    averageScore,
    currentRank: scores[0]?.rank ?? "Unranked",
    latestDebate: debates[0] ?? null,
    latestScore: scores[0] ?? null,
    scoreHistory,
    improvementTrend,
    weakestSkill,
    focusRecommendation: getFocusRecommendation(weakestSkill.label),
    recentArguments,
  };
}

function getImprovementTrend(scores: DebateScore[]): ProfileStats["improvementTrend"] {
  if (scores.length < 2) {
    return { label: "Needs 2 judged debates", delta: null };
  }

  const newest = scores[0].overall;
  const previous = scores[1].overall;
  const delta = newest - previous;

  if (delta > 0) return { label: "Improving", delta };
  if (delta < 0) return { label: "Needs recovery", delta };
  return { label: "Stable", delta };
}

function getWeakestSkill(scores: DebateScore[]): ProfileStats["weakestSkill"] {
  if (!scores.length) {
    return { label: "Not enough data", score: null };
  }

  const skillValues = [
    { label: "Structure", values: scores.map((score) => score.structure) },
    { label: "Logic", values: scores.map((score) => score.logic) },
    { label: "Evidence", values: scores.map((score) => score.evidence) },
    { label: "Rebuttal", values: scores.map((score) => score.rebuttal) },
    { label: "Speaking style", values: scores.map((score) => score.speakingStyle) },
  ].map((skill) => ({
    label: skill.label,
    score: Math.round(
      skill.values.reduce((sum, value) => sum + value, 0) / skill.values.length,
    ),
  }));

  return skillValues.sort((a, b) => a.score - b.score)[0];
}

function getFocusRecommendation(weakestSkill: string): string {
  switch (weakestSkill) {
    case "Structure":
      return "Open with a clear claim, then add one reason and one impact before moving on.";
    case "Logic":
      return "Make every argument pass the because-test: claim, because, therefore.";
    case "Evidence":
      return "Add one concrete example, statistic, or real-world case to each main point.";
    case "Rebuttal":
      return "Spend one paragraph directly comparing your case against the bot's strongest answer.";
    case "Speaking style":
      return "Use shorter sentences and signpost your points so the judge can follow the speech.";
    default:
      return "Complete two judged debates to unlock a focused training recommendation.";
  }
}

async function updateStore<T>(mutator: (store: StoreData) => T): Promise<T> {
  const nextWrite = writeQueue.then(async () => {
    const store = await readStore();
    const result = mutator(store);
    await writeStore(store);
    return result;
  });

  writeQueue = nextWrite.then(
    () => undefined,
    () => undefined,
  );

  return nextWrite;
}

async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(activeStorePath, "utf8");
    return { ...emptyStore, ...(JSON.parse(raw) as Partial<StoreData>) };
  } catch (error) {
    if (isMissingFile(error)) {
      return structuredClone(emptyStore);
    }
    throw error;
  }
}

async function writeStore(store: StoreData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(activeStorePath), { recursive: true });
    await fs.writeFile(activeStorePath, `${JSON.stringify(store, null, 2)}\n`);
  } catch (error) {
    if (!isReadOnlyFileSystem(error)) throw error;
    activeStorePath = tmpStorePath;
    await fs.writeFile(activeStorePath, `${JSON.stringify(store, null, 2)}\n`);
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function isReadOnlyFileSystem(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    ((error as NodeJS.ErrnoException).code === "EROFS" ||
      (error as NodeJS.ErrnoException).code === "EACCES")
  );
}
