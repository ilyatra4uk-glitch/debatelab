import { SiteShell } from "../SiteShell";
import { friends } from "../data";

export default function FriendsPage() {
  return (
    <SiteShell>
      <section className="section-block">
        <div className="section-title">
          <p className="eyebrow">Friends</p>
          <h2>Your debate friends</h2>
        </div>
        <div className="friend-page-list">
          {friends.map((friend) => (
            <article className="friend-page-card" key={friend.name}>
              <div className="mini-avatar" aria-hidden="true">
                {friend.name.slice(0, 1)}
              </div>
              <div>
                <h3>{friend.name}</h3>
                <p>{friend.record}</p>
              </div>
              <strong>{friend.status}</strong>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
