import { SiteShell } from "../SiteShell";
import { getCurrentUserState } from "../lib/current-user";
import { getOrCreateUser } from "../lib/debate-store";
import { getFriendsData } from "../lib/friends-store";
import { FriendsClient } from "./FriendsClient";

export default async function FriendsPage() {
  const { user } = await getCurrentUserState();
  const storedUser = await getOrCreateUser(user);
  const { friends, incoming } = await getFriendsData(storedUser.userId);
  return <SiteShell><div className="page-heading"><p className="eyebrow">Friends</p><h1>Your debate circle</h1></div><FriendsClient incoming={incoming} /><section className="friends-section"><p className="eyebrow">Friends&apos; stats</p><h2>Practice together</h2>{friends.length ? <div className="friend-grid">{friends.map((friend) => <article className="friend-card" key={friend.userId}><div className="friend-card-heading"><div className="friend-avatar" aria-hidden="true">{friend.displayName.slice(0, 1).toUpperCase()}</div><div><h3>{friend.displayName}</h3><span>{friend.login ? `@${friend.login}` : "DebateLab member"}</span></div></div><div className="friend-stat-grid"><div><strong>{friend.practiceCount}</strong><span>practices</span></div><div><strong>{friend.averageScore ?? "—"}</strong><span>average score</span></div><div><strong>{friend.currentStreak}</strong><span>day streak</span></div></div></article>)}</div> : <p className="friends-empty">Add friends to compare your practice rhythm and results.</p>}</section></SiteShell>;
}
