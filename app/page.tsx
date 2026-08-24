import { SiteShell } from "./SiteShell";
import { achievements, friends } from "./data";

export default function Home() {
  return (
    <SiteShell>
      <section className="dashboard-grid" aria-label="Profile dashboard">
        <article className="profile-panel">
          <div className="avatar" aria-hidden="true">
            IK
          </div>
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Ilya K.</h2>
            <p>Strategic speaker</p>
          </div>
        </article>

        {achievements.map((achievement) => (
          <article className="stat-panel" key={achievement.label}>
            <p className="eyebrow">{achievement.label}</p>
            <strong>{achievement.value}</strong>
          </article>
        ))}

        <article className="friends-panel">
          <p className="eyebrow">Friends</p>
          <div className="friend-list">
            {friends.map((friend) => (
              <button key={friend.name} type="button">
                <span>
                  <strong>{friend.name}</strong>
                  <small>{friend.record}</small>
                </span>
                <em>{friend.status}</em>
              </button>
            ))}
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
