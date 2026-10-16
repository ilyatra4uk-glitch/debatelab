import { getCurrentUserState } from "@/app/lib/current-user";
import { getOrCreateUser } from "@/app/lib/debate-store";
import { acceptFriendInvite } from "@/app/lib/friends-store";

export async function POST(request: Request) {
  const { isRegistered, user } = await getCurrentUserState();
  if (!isRegistered) return Response.json({ error: "Sign in to manage friends." }, { status: 401 });
  try {
    const payload = await request.json() as { invitationId?: string };
    if (!payload.invitationId) return Response.json({ error: "Invitation not found." }, { status: 400 });
    const storedUser = await getOrCreateUser(user);
    await acceptFriendInvite(storedUser.userId, payload.invitationId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not accept invitation." }, { status: 400 });
  }
}
