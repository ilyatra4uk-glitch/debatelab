import { SiteShell } from "./SiteShell";
import { ProfileClientStats } from "./ProfileClientStats";
import { getCurrentUserState } from "./lib/current-user";
import { getOrCreateUser, getProfileStats } from "./lib/debate-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const { isRegistered, user: authUser } = await getCurrentUserState();

  if (!isRegistered) {
    return (
      <SiteShell>
        <section className="welcome-panel" aria-label="Welcome">
          <div className="welcome-copy">
            <p className="eyebrow">DebateLab</p>
            <h1>Practice debating with an AI judge</h1>
            <p>
              Create a speaker profile to save your bot debates, scores, rank,
              and feedback history.
            </p>
            <div className="welcome-actions">
              <a className="primary-link-action" href="/register">
                Create profile
              </a>
              <a className="secondary-link-action" href="/videos">
                Watch lessons
              </a>
            </div>
          </div>
          <aside className="welcome-preview" aria-label="MVP flow">
            <p className="eyebrow">First scenario</p>
            <ol>
              <li>Choose a debate motion</li>
              <li>Write your opening argument</li>
              <li>Get bot response and AI judging</li>
              <li>Track your score in profile</li>
            </ol>
          </aside>
        </section>
      </SiteShell>
    );
  }

  const user = await getOrCreateUser(authUser);
  const stats = await getProfileStats(user.userId);
  const initials = user.displayName
    .split(/\s+/)
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const achievements = [
    { label: "Debates", value: String(stats.debateCount) },
    { label: "Avg score", value: stats.averageScore ? String(stats.averageScore) : "--" },
  ];

  return (
    <SiteShell>
      <section className="dashboard-grid" aria-label="Profile dashboard">
        <article className="profile-panel">
          <div className="avatar" aria-hidden="true">
            {initials || "DL"}
          </div>
          <div>
            <p className="eyebrow">Profile</p>
            <h2>{user.displayName}</h2>
            <p>{stats.currentRank}</p>
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

        <article className="history-panel">
          <p className="eyebrow">Latest result</p>
          <h2>{stats.latestScore ? `${stats.latestScore.overall}/100` : "No score yet"}</h2>
          <p>
            {stats.latestScore?.feedback ??
              "Complete a bot debate and judge it to build your score history."}
          </p>
        </article>

        <ProfileClientStats />

        <article className="progress-panel">
          <p className="eyebrow">Progress</p>
          <h2>{stats.improvementTrend.label}</h2>
          <p>
            {stats.improvementTrend.delta === null
              ? "Finish another judged bot debate to see whether your score is moving up."
              : `${stats.improvementTrend.delta > 0 ? "+" : ""}${stats.improvementTrend.delta} points since your previous judged debate.`}
          </p>
        </article>

        <article className="progress-panel focus-panel">
          <p className="eyebrow">Weakest area</p>
          <h2>
            {stats.weakestSkill.label}
            {stats.weakestSkill.score ? ` ${stats.weakestSkill.score}/10` : ""}
          </h2>
          <p>{stats.focusRecommendation}</p>
        </article>

        <article className="arguments-panel">
          <p className="eyebrow">Saved arguments</p>
          <h2>Recent speeches</h2>
          {stats.recentArguments.length ? (
            <div className="argument-list">
              {stats.recentArguments.map((argument) => (
                <section key={argument.id}>
                  <strong>{argument.motion}</strong>
                  <p>{argument.content}</p>
                </section>
              ))}
            </div>
          ) : (
            <p>Your saved arguments will appear here after your first bot debate.</p>
          )}
        </article>
      </section>
    </SiteShell>
  );
}
