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
  PracticeDetail,
  PracticeSummary,
  PracticeRevision,
} from "./debate-types";
import {
  getSupabaseDatabaseClient,
  isSupabaseDatabaseConfigured,
} from "./supabase-server";

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
  revisions: PracticeRevision[];
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
  revisions: [],
};

const storePath =
  process.env.DEBATELAB_STORE_PATH ??
  path.join(".debatedata", "store.json");
const tmpStorePath = path.join("/tmp", ".debatedata.json");

let writeQueue = Promise.resolve();
let activeStorePath = storePath;

export async function getOrCreateUser(user: ChatGPTUser): Promise<StoredUser> {
  if (isSupabaseDatabaseConfigured()) {
    return getOrCreateSupabaseUser(user);
  }

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
  if (isSupabaseDatabaseConfigured()) {
    return getSupabaseUserByEmail(email);
  }

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
  if (isSupabaseDatabaseConfigured()) {
    return createSupabaseBotDebate({ userId, motion, side });
  }

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
  if (isSupabaseDatabaseConfigured()) {
    return addSupabaseDebateTurn({ debateId, speaker, content });
  }

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
  if (isSupabaseDatabaseConfigured()) {
    return getSupabaseDebateForUser(debateId, userId);
  }

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
  if (isSupabaseDatabaseConfigured()) {
    return saveSupabaseScore({ debateId, userId, score });
  }

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
  if (isSupabaseDatabaseConfigured()) {
    return getSupabaseProfileStats(userId);
  }

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
  const activity = getWeeklyActivity(debates);

  return {
    debateCount: debates.length,
    averageScore,
    ...activity,
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

async function getOrCreateSupabaseUser(user: ChatGPTUser): Promise<StoredUser> {
  const now = new Date().toISOString();
  const payload = {
    id: user.userId,
    email: user.email,
    display_name: user.displayName,
    full_name: user.fullName,
    updated_at: now,
  };
  const { data, error } = await getSupabaseDatabaseClient()
    .from("users")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseUser(data);
}

async function getSupabaseUserByEmail(
  email: string,
): Promise<StoredUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await getSupabaseDatabaseClient()
    .from("users")
    .select()
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSupabaseUser(data) : null;
}

async function createSupabaseBotDebate({
  userId,
  motion,
  side,
}: {
  userId: string;
  motion: string;
  side: DebateSide;
}): Promise<DebateRecord> {
  const now = new Date().toISOString();
  const payload = {
    id: crypto.randomUUID(),
    user_id: userId,
    mode: "bot",
    motion,
    side,
    status: "active",
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await getSupabaseDatabaseClient()
    .from("debates")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseDebate(data);
}

async function addSupabaseDebateTurn({
  debateId,
  speaker,
  content,
}: {
  debateId: string;
  speaker: DebateTurn["speaker"];
  content: string;
}): Promise<DebateTurn> {
  const now = new Date().toISOString();
  const client = getSupabaseDatabaseClient();
  const { data, error } = await client
    .from("debate_turns")
    .insert({
      id: crypto.randomUUID(),
      debate_id: debateId,
      speaker,
      content,
      created_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await client
    .from("debates")
    .update({ updated_at: now })
    .eq("id", debateId);

  return mapSupabaseTurn(data);
}

async function getSupabaseDebateForUser(
  debateId: string,
  userId: string,
): Promise<{ debate: DebateRecord; turns: DebateTurn[] }> {
  const client = getSupabaseDatabaseClient();
  const { data: debateData, error: debateError } = await client
    .from("debates")
    .select()
    .eq("id", debateId)
    .eq("user_id", userId)
    .maybeSingle();

  if (debateError) throw new Error(debateError.message);
  if (!debateData) throw new Error("Debate not found.");

  const { data: turnData, error: turnError } = await client
    .from("debate_turns")
    .select()
    .eq("debate_id", debateId)
    .order("created_at", { ascending: true }).order("position", { ascending: true });

  if (turnError) throw new Error(turnError.message);

  return {
    debate: mapSupabaseDebate(debateData),
    turns: (turnData ?? []).map(mapSupabaseTurn),
  };
}

async function saveSupabaseScore({
  debateId,
  userId,
  score,
}: {
  debateId: string;
  userId: string;
  score: Omit<DebateScore, "id" | "debateId" | "userId" | "createdAt">;
}): Promise<DebateScore> {
  const now = new Date().toISOString();
  const client = getSupabaseDatabaseClient();
  const { data: debateData, error: debateError } = await client
    .from("debates")
    .select("id")
    .eq("id", debateId)
    .eq("user_id", userId)
    .maybeSingle();

  if (debateError) throw new Error(debateError.message);
  if (!debateData) throw new Error("Debate not found.");

  const { data, error } = await client
    .from("scores")
    .upsert({
      id: crypto.randomUUID(),
      debate_id: debateId,
      user_id: userId,
      structure: score.structure,
      logic: score.logic,
      evidence: score.evidence,
      rebuttal: score.rebuttal,
      speaking_style: score.speakingStyle,
      overall: score.overall,
      rank: score.rank,
      feedback: score.feedback,
      created_at: now,
    }, { onConflict: "debate_id" })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await client
    .from("debates")
    .update({ status: "judged", updated_at: now })
    .eq("id", debateId);

  return mapSupabaseScore(data);
}

async function getSupabaseProfileStats(userId: string): Promise<ProfileStats> {
  const client = getSupabaseDatabaseClient();
  const [
    { data: debateData, error: debateError },
    { data: scoreData, error: scoreError },
    { data: turnData, error: turnError },
  ] = await Promise.all([
    client
      .from("debates")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("scores")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("debate_turns")
      .select("id, debate_id, content, created_at, debates!inner(motion, user_id)")
      .eq("speaker", "user")
      .eq("debates.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (debateError) throw new Error(debateError.message);
  if (scoreError) throw new Error(scoreError.message);
  if (turnError) throw new Error(turnError.message);

  const debates = (debateData ?? []).map(mapSupabaseDebate);
  const scores = (scoreData ?? []).map(mapSupabaseScore);
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score.overall, 0) / scores.length)
    : null;
  const weakestSkill = getWeakestSkill(scores);
  const activity = getWeeklyActivity(debates);

  return {
    debateCount: debates.length,
    averageScore,
    ...activity,
    currentRank: scores[0]?.rank ?? "Unranked",
    latestDebate: debates[0] ?? null,
    latestScore: scores[0] ?? null,
    scoreHistory: scores.slice(0, 5),
    improvementTrend: getImprovementTrend(scores),
    weakestSkill,
    focusRecommendation: getFocusRecommendation(weakestSkill.label),
    recentArguments: (turnData ?? []).map((turn) => ({
      id: String(turn.id),
      motion: getJoinedDebateMotion(turn),
      content: String(turn.content),
      createdAt: String(turn.created_at),
    })),
  };
}

function getWeeklyActivity(debates: DebateRecord[]): Pick<ProfileStats, "weeklyActivity" | "activeDaysThisWeek" | "currentStreak"> {
  const timeZone = "Europe/Dublin";
  const today = dateKeyInTimeZone(new Date(), timeZone);
  const [year, month, day] = today.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("en-IE", { weekday: "short", timeZone }).format(new Date(`${today}T12:00:00Z`));
  const offsetFromMonday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const monday = new Date(Date.UTC(year, month - 1, day - Math.max(offsetFromMonday, 0)));
  const activeDates = new Set(debates.map((debate) => dateKeyInTimeZone(new Date(debate.createdAt), timeZone)));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  let currentStreak = 0;
  for (let index = 0; ; index += 1) {
    const date = new Date(Date.UTC(year, month - 1, day - index)).toISOString().slice(0, 10);
    if (!activeDates.has(date)) break;
    currentStreak += 1;
  }

  return {
    weeklyActivity: weekDates.map((date) => ({
      label: new Intl.DateTimeFormat("en-IE", { weekday: "short", timeZone }).format(new Date(`${date}T12:00:00Z`)),
      active: activeDates.has(date),
    })),
    activeDaysThisWeek: weekDates.filter((date) => activeDates.has(date)).length,
    currentStreak,
  };
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function getJoinedDebateMotion(turn: { debates?: unknown }): string {
  const debate = Array.isArray(turn.debates) ? turn.debates[0] : turn.debates;
  return typeof debate === "object" && debate !== null && "motion" in debate
    ? String(debate.motion)
    : "Saved debate";
}

function mapSupabaseUser(row: Record<string, unknown>): StoredUser {
  const displayName = String(row.display_name ?? row.email ?? "Debater");
  return {
    userId: String(row.id),
    email: String(row.email),
    displayName,
    fullName: row.full_name ? String(row.full_name) : displayName,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSupabaseDebate(row: Record<string, unknown>): DebateRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    mode: row.mode === "friend" ? "friend" : "bot",
    motion: String(row.motion),
    side: row.side === "against" ? "against" : "for",
    status:
      row.status === "draft" || row.status === "judged"
        ? row.status
        : "active",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSupabaseTurn(row: Record<string, unknown>): DebateTurn {
  return {
    id: String(row.id),
    debateId: String(row.debate_id),
    speaker: row.speaker === "bot" ? "bot" : "user",
    content: String(row.content),
    createdAt: String(row.created_at),
  };
}

function mapSupabaseScore(row: Record<string, unknown>): DebateScore {
  return {
    id: String(row.id),
    debateId: String(row.debate_id),
    userId: String(row.user_id),
    structure: Number(row.structure),
    logic: Number(row.logic),
    evidence: Number(row.evidence),
    rebuttal: Number(row.rebuttal),
    speakingStyle: Number(row.speaking_style),
    overall: Number(row.overall),
    rank: String(row.rank),
    feedback: String(row.feedback),
    createdAt: String(row.created_at),
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
    const temporaryPath = `${activeStorePath}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`);
    await fs.rename(temporaryPath, activeStorePath);
  } catch (error) {
    if (!isReadOnlyFileSystem(error)) throw error;
    activeStorePath = tmpStorePath;
    const temporaryPath = `${activeStorePath}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`);
    await fs.rename(temporaryPath, activeStorePath);
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


export async function getPractice(debateId: string, userId: string): Promise<PracticeDetail> {
  const detail = await getDebateForUser(debateId, userId);
  if (isSupabaseDatabaseConfigured()) {
    const client = getSupabaseDatabaseClient();
    const [scores, revisions] = await Promise.all([
      client.from("scores").select().eq("debate_id", debateId).eq("user_id", userId).maybeSingle(),
      client.from("practice_revisions").select().eq("debate_id", debateId).order("created_at"),
    ]);
    if (scores.error) throw new Error(scores.error.message);
    if (revisions.error) throw new Error(revisions.error.message);
    return { ...detail, score: scores.data ? mapSupabaseScore(scores.data) : null,
      revisions: (revisions.data ?? []).map((row) => ({ id: row.id, debateId: row.debate_id, turnId: row.turn_id, content: row.content, feedback: row.feedback, createdAt: row.created_at })) };
  }
  const store = await readStore();
  return { ...detail, score: store.scores.find((score) => score.debateId === debateId && score.userId === userId) ?? null,
    revisions: store.revisions.filter((revision) => revision.debateId === debateId) };
}

export async function listPractices(userId: string): Promise<PracticeSummary[]> {
  if (isSupabaseDatabaseConfigured()) {
    const { data, error } = await getSupabaseDatabaseClient().from("debates")
      .select("*, debate_turns(speaker), scores(*)").eq("user_id", userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ debate: mapSupabaseDebate(row),
      speeches: row.debate_turns.filter((turn: { speaker: string }) => turn.speaker === "user").length,
      score: row.scores[0] ? mapSupabaseScore(row.scores[0]) : null }));
  }
  const store = await readStore();
  return store.debates.filter((debate) => debate.userId === userId)
    .sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map((debate) => ({ debate,
      speeches: store.turns.filter((turn) => turn.debateId === debate.id && turn.speaker === "user").length,
      score: store.scores.find((score) => score.debateId === debate.id) ?? null }));
}

export async function savePracticeExchange(input: {
  userId: string; debateId?: string; motion: string; side: DebateSide;
  expectedTurns: number; argument: string; reply: string;
}): Promise<PracticeDetail> {
  let debateId: string;
  if (isSupabaseDatabaseConfigured()) {
    const { data, error } = await getSupabaseDatabaseClient().rpc("save_practice_exchange", {
      p_user_id: input.userId, p_debate_id: input.debateId ?? null, p_motion: input.motion,
      p_side: input.side, p_expected_turns: input.expectedTurns, p_argument: input.argument, p_reply: input.reply,
    });
    if (error) throw new Error(error.message);
    debateId = String(data);
  } else {
    debateId = await updateStore((store) => {
      const now = new Date().toISOString();
      let debate = input.debateId ? store.debates.find((item) => item.id === input.debateId && item.userId === input.userId) : undefined;
      if (input.debateId && !debate) throw new Error("Practice not found.");
      const count = debate ? store.turns.filter((turn) => turn.debateId === input.debateId).length : 0;
      if (count !== input.expectedTurns || count >= 6 || count % 2 || debate?.status === "judged") throw new Error("Practice changed. Reload and try again.");
      if (!debate) {
        debate = { id: crypto.randomUUID(), userId: input.userId, motion: input.motion, side: input.side,
          mode: "bot", status: "active", createdAt: now, updatedAt: now };
        store.debates.push(debate);
      }
      debate.updatedAt = now;
      store.turns.push({ id: crypto.randomUUID(), debateId: debate.id, speaker: "user", content: input.argument, createdAt: now },
        { id: crypto.randomUUID(), debateId: debate.id, speaker: "bot", content: input.reply, createdAt: now });
      return debate.id;
    });
  }
  return getPractice(debateId, input.userId);
}

export async function savePracticeRevision(userId: string, input: Omit<PracticeRevision, "id" | "createdAt">): Promise<PracticeRevision> {
  const detail = await getPractice(input.debateId, userId);
  if (!detail.score || !detail.turns.some((turn) => turn.id === input.turnId && turn.speaker === "user")) throw new Error("Finish the practice before improving a speech.");
  const revision = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  if (isSupabaseDatabaseConfigured()) {
    const { error } = await getSupabaseDatabaseClient().from("practice_revisions").insert({ id: revision.id,
      debate_id: input.debateId, turn_id: input.turnId, content: input.content, feedback: input.feedback, created_at: revision.createdAt });
    if (error) throw new Error(error.message);
  } else await updateStore((store) => { store.revisions.push(revision); });
  return revision;
}
