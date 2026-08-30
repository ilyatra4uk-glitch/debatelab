import { SiteShell } from "./SiteShell";
import { achievements } from "./data";

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

        <a className="home-link-panel" href="/videos">
          <p className="eyebrow">Videos</p>
          <h2>Watch debate lessons</h2>
          <span>Open videos</span>
        </a>
      </section>
    </SiteShell>
  );
}
