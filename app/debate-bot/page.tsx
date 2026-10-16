import { PracticeClient } from "../PracticeClient";
import { getCurrentUserState } from "../lib/current-user";
import { getProfileStats } from "../lib/debate-store";
import { redirect } from "next/navigation";

export default async function DebateBotPage() {
  const { isRegistered, user } = await getCurrentUserState();
  if (!isRegistered) redirect("/login");
  const stats = await getProfileStats(user.userId);
  return <PracticeClient previousScore={stats.latestScore?.overall ?? null} />;
}
