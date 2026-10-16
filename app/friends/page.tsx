import { SiteShell } from "../SiteShell";
import { getCurrentUserState } from "../lib/current-user";
import { getOrCreateUser } from "../lib/debate-store";
import { getFriendsData } from "../lib/friends-store";
import { FriendsClient } from "./FriendsClient";

export default async function FriendsPage() {
  const { user } = await getCurrentUserState();
  const storedUser = await getOrCreateUser(user);
  const { friends, incoming, outgoing } = await getFriendsData(storedUser.userId);
  return <SiteShell><div className="page-heading"><h1>Your debate circle</h1></div><FriendsClient friends={friends} incoming={incoming} outgoing={outgoing} /></SiteShell>;
}
