import { getCurrentUserState } from "@/app/lib/current-user";
import { getOrCreateUser } from "@/app/lib/debate-store";
import { sendFriendInvite } from "@/app/lib/friends-store";

export async function POST(request: Request) {
  const { isRegistered, user } = await getCurrentUserState();
  if (!isRegistered) return Response.json({ error: "Sign in to add friends." }, { status: 401 });
  try {
    const payload = await request.json() as { login?: string };
    if (!payload.login?.trim()) return Response.json({ error: "Enter a login." }, { status: 400 });
    const storedUser = await getOrCreateUser(user);
    await sendFriendInvite(storedUser.userId, payload.login);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not send invitation." }, { status: 400 });
  }
}
