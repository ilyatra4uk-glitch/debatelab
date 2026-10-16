import { SiteShell } from "../SiteShell";
import { ProfileClient } from "../ProfileClient";
import { getCurrentUserState } from "../lib/current-user";
import { getPasswordAccountUsername } from "../lib/password-auth";

export default async function ProfilePage() {
  const { user } = await getCurrentUserState();
  const canChangePassword = user.userId.startsWith("account:");
  const username = canChangePassword ? await getPasswordAccountUsername(user.userId) : null;
  return <SiteShell><ProfileClient fullName={user.fullName ?? user.displayName} email={user.email} username={username} canChangePassword={canChangePassword} /></SiteShell>;
}
