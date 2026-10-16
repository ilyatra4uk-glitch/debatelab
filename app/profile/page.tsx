import { SiteShell } from "../SiteShell";
import { ProfileClient } from "../ProfileClient";
import { getCurrentUserState } from "../lib/current-user";

export default async function ProfilePage() {
  const { user } = await getCurrentUserState();
  return <SiteShell><ProfileClient fullName={user.fullName ?? user.displayName} email={user.email} canChangePassword={user.userId.startsWith("account:")} /></SiteShell>;
}
