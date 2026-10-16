import { getCurrentUserState } from "@/app/lib/current-user";
import { getOrCreateUser } from "@/app/lib/debate-store";
import { removeFriend } from "@/app/lib/friends-store";

export async function POST(request: Request) {
  const { isRegistered, user } = await getCurrentUserState();
  if (!isRegistered) return Response.json({ error: "Sign in to manage friends." }, { status: 401 });
  try {
    const payload = await request.json() as { friendId?: string };
    if (!payload.friendId) return Response.json({ error: "Friend not found." }, { status: 400 });
    const storedUser = await getOrCreateUser(user);
    await removeFriend(storedUser.userId, payload.friendId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not remove friend." }, { status: 400 });
  }
}
