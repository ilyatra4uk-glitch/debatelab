import { getSupabaseDatabaseClient, isSupabaseDatabaseConfigured } from "./supabase-server";

export type FriendStats = {
  userId: string;
  displayName: string;
  login: string | null;
  practiceCount: number;
  averageScore: number | null;
  currentStreak: number;
};

export type FriendInvitation = {
  id: string;
  displayName: string;
  login: string | null;
  createdAt: string;
};

export async function getFriendsData(userId: string): Promise<{ friends: FriendStats[]; incoming: FriendInvitation[] }> {
  if (!isSupabaseDatabaseConfigured()) return { friends: [], incoming: [] };
  const client = getSupabaseDatabaseClient();
  const { data: friendshipRows, error } = await client
    .from("friendships")
    .select("id,requester_id,recipient_id,status,created_at")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
  if (error) throw new Error(error.message);

  const rows = friendshipRows ?? [];
  const friendIds = rows.filter((row) => row.status === "accepted").map((row) => String(row.requester_id) === userId ? String(row.recipient_id) : String(row.requester_id));
  const incomingRows = rows.filter((row) => row.status === "pending" && String(row.recipient_id) === userId);
  const peopleIds = [...new Set([...friendIds, ...incomingRows.map((row) => String(row.requester_id))])];
  if (!peopleIds.length) return { friends: [], incoming: [] };

  const [{ data: users, error: usersError }, { data: debates, error: debatesError }, { data: scores, error: scoresError }] = await Promise.all([
    client.from("users").select("id,display_name,login").in("id", peopleIds),
    client.from("debates").select("user_id,created_at").in("user_id", friendIds),
    client.from("scores").select("user_id,overall").in("user_id", friendIds),
  ]);
  if (usersError) throw new Error(usersError.message);
  if (debatesError) throw new Error(debatesError.message);
  if (scoresError) throw new Error(scoresError.message);

  const usersById = new Map((users ?? []).map((row) => [String(row.id), { displayName: String(row.display_name ?? "Debater"), login: row.login ? String(row.login) : null }]));
  const friendDebates = debates ?? [];
  const friendScores = scores ?? [];
  const friends = friendIds.map((friendId) => {
    const person = usersById.get(friendId);
    const practices = friendDebates.filter((row) => String(row.user_id) === friendId);
    const marks = friendScores.filter((row) => String(row.user_id) === friendId).map((row) => Number(row.overall));
    return {
      userId: friendId,
      displayName: person?.displayName ?? "Debater",
      login: person?.login ?? null,
      practiceCount: practices.length,
      averageScore: marks.length ? Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length) : null,
      currentStreak: currentStreak(practices.map((row) => String(row.created_at))),
    };
  }).sort((a, b) => b.practiceCount - a.practiceCount || a.displayName.localeCompare(b.displayName));

  return {
    friends,
    incoming: incomingRows.map((row) => ({ id: String(row.id), displayName: usersById.get(String(row.requester_id))?.displayName ?? "Debater", login: usersById.get(String(row.requester_id))?.login ?? null, createdAt: String(row.created_at) })),
  };
}

export async function getCommunityScoreLeader(): Promise<FriendStats | null> {
  if (!isSupabaseDatabaseConfigured()) return null;
  const client = getSupabaseDatabaseClient();
  const [{ data: users, error: usersError }, { data: debates, error: debatesError }, { data: scores, error: scoresError }] = await Promise.all([
    client.from("users").select("id,display_name,login"),
    client.from("debates").select("user_id,created_at"),
    client.from("scores").select("user_id,overall"),
  ]);
  if (usersError) throw new Error(usersError.message);
  if (debatesError) throw new Error(debatesError.message);
  if (scoresError) throw new Error(scoresError.message);
  const allScores = scores ?? [];
  if (!allScores.length) return null;
  const allDebates = debates ?? [];
  const leader = (users ?? []).map((row) => {
    const userId = String(row.id);
    const marks = allScores.filter((score) => String(score.user_id) === userId).map((score) => Number(score.overall));
    const practices = allDebates.filter((debate) => String(debate.user_id) === userId);
    return { userId, displayName: String(row.display_name ?? "Debater"), login: row.login ? String(row.login) : null, practiceCount: practices.length, averageScore: marks.length ? Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length) : null, currentStreak: currentStreak(practices.map((debate) => String(debate.created_at))) };
  }).filter((row) => row.averageScore !== null).sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0) || b.practiceCount - a.practiceCount)[0];
  return leader ?? null;
}

export async function getCommunityLeaders(): Promise<{ practices: FriendStats | null; streak: FriendStats | null }> {
  if (!isSupabaseDatabaseConfigured()) return { practices: null, streak: null };
  const client = getSupabaseDatabaseClient();
  const [{ data: users, error: usersError }, { data: debates, error: debatesError }, { data: scores, error: scoresError }] = await Promise.all([
    client.from("users").select("id,display_name,login"),
    client.from("debates").select("user_id,created_at"),
    client.from("scores").select("user_id,overall"),
  ]);
  if (usersError) throw new Error(usersError.message);
  if (debatesError) throw new Error(debatesError.message);
  if (scoresError) throw new Error(scoresError.message);
  const allDebates = debates ?? [];
  const allScores = scores ?? [];
  const rows = (users ?? []).map((row) => {
    const userId = String(row.id);
    const practices = allDebates.filter((debate) => String(debate.user_id) === userId);
    const marks = allScores.filter((score) => String(score.user_id) === userId).map((score) => Number(score.overall));
    return { userId, displayName: String(row.display_name ?? "Debater"), login: row.login ? String(row.login) : null, practiceCount: practices.length, averageScore: marks.length ? Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length) : null, currentStreak: currentStreak(practices.map((debate) => String(debate.created_at))) };
  });
  return {
    practices: [...rows].filter((row) => row.practiceCount > 0).sort((a, b) => b.practiceCount - a.practiceCount || b.currentStreak - a.currentStreak)[0] ?? null,
    streak: [...rows].filter((row) => row.currentStreak > 0).sort((a, b) => b.currentStreak - a.currentStreak || b.practiceCount - a.practiceCount)[0] ?? null,
  };
}

export async function sendFriendInvite(senderId: string, login: string) {
  if (!isSupabaseDatabaseConfigured()) throw new Error("Friends are available when the database is configured.");
  const client = getSupabaseDatabaseClient();
  const normalizedLogin = login.trim().toLowerCase();
  const { data: recipient, error: recipientError } = await client.from("users").select("id").eq("login", normalizedLogin).maybeSingle();
  if (recipientError) throw new Error(recipientError.message);
  if (!recipient) throw new Error("No user found with that login.");
  const recipientId = String(recipient.id);
  if (recipientId === senderId) throw new Error("You cannot add yourself.");
  const { data: existing, error: existingError } = await client.from("friendships").select("id,status").or(`and(requester_id.eq.${senderId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${senderId})`).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.status === "accepted") throw new Error("You are already friends.");
  if (existing) throw new Error("An invitation is already waiting for a response.");
  const { error } = await client.from("friendships").insert({ id: crypto.randomUUID(), requester_id: senderId, recipient_id: recipientId, status: "pending" });
  if (error) throw new Error(error.message);
}

export async function acceptFriendInvite(userId: string, invitationId: string) {
  if (!isSupabaseDatabaseConfigured()) throw new Error("Friends are available when the database is configured.");
  const { data, error } = await getSupabaseDatabaseClient().from("friendships").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", invitationId).eq("recipient_id", userId).eq("status", "pending").select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This invitation is no longer available.");
}

function currentStreak(createdAt: string[]) {
  const dates = new Set(createdAt.map((value) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value))));
  let streak = 0;
  for (let day = new Date(); ; day.setUTCDate(day.getUTCDate() - 1)) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin", year: "numeric", month: "2-digit", day: "2-digit" }).format(day);
    if (!dates.has(key)) return streak;
    streak += 1;
  }
}
