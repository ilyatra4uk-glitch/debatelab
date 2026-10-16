import { getCurrentUserState } from "@/app/lib/current-user";
import { updatePasswordAccount, updatePasswordAccountName, updatePasswordAccountUsername } from "@/app/lib/password-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { isRegistered, user } = await getCurrentUserState();
    if (!isRegistered || !user.userId.startsWith("account:")) return Response.json({ error: "This profile is managed by your sign-in provider." }, { status: 403 });
    const payload = await request.json() as { action?: string; fullName?: string; username?: string; currentPassword?: string; newPassword?: string };
    if (payload.action === "name") {
      const fullName = await updatePasswordAccountName({ userId: user.userId, fullName: payload.fullName ?? "" });
      return Response.json({ fullName });
    }
    if (payload.action === "username") {
      const username = await updatePasswordAccountUsername({ userId: user.userId, username: payload.username ?? "" });
      return Response.json({ username });
    }
    if (payload.action === "password") {
      await updatePasswordAccount({ userId: user.userId, currentPassword: payload.currentPassword ?? "", newPassword: payload.newPassword ?? "" });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown profile change." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update your profile." }, { status: 400 });
  }
}
