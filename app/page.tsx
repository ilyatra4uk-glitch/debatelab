import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "./SiteShell";
import { getCurrentUserState } from "./lib/current-user";
import { getOrCreateUser, getProfileStats } from "./lib/debate-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const { isRegistered, user: authUser } = await getCurrentUserState();

  if (!isRegistered) redirect("/login");

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
  const chart = stats.progressHistory;
  const chartPoints = chart.map((entry, index) => {
    const x = chart.length === 1 ? 150 : 16 + (index * 268) / (chart.length - 1);
    const y = 86 - entry.comparableScore * 0.7;
    return `${x},${y}`;
  }).join(" ");

  return (
    <SiteShell>
      <div className="page-heading"><div><p className="eyebrow">Your workspace</p><h1>Overview</h1><p>Track your practice and build a stronger argument.</p></div><a className="primary-link-action" href="/debate-bot">Start a debate →</a></div>
      <Link className="journal-link" href="/practices">View all my practices and continue a round →</Link>
      <section className="dashboard-grid" aria-label="Profile dashboard">
        <article className="profile-panel">
          <div className="avatar" aria-hidden="true">
            {initials || "DL"}
          </div>
          <div>
            <p className="eyebrow">Profile</p>
            <h2>{user.displayName}</h2>
            <p>{stats.debateCount ? "Building your skills, one round at a time" : "Ready for your first round"}</p>
          </div>
        </article>

        {achievements.map((achievement) => (
          <article className="stat-panel" key={achievement.label}>
            <p className="eyebrow">{achievement.label}</p>
            <strong>{achievement.value}</strong>
          </article>
        ))}

        <article className="streak-panel">
          <div>
            <p className="eyebrow">This week</p>
            <h2>{stats.activeDaysThisWeek} of 7 days practised</h2>
            <p>{stats.currentStreak ? `${stats.currentStreak}-day streak — keep it going.` : "Start a practice today to begin your streak."}</p>
          </div>
          <div className="level-summary">
            <div><p className="eyebrow">Level</p><strong>{stats.level.label}</strong></div>
            <div><p className="eyebrow">Rhythm</p><strong>{stats.practiceRhythm.label}</strong><span>{stats.practiceRhythm.activeDaysLast28} days in 28</span></div>
          </div>
          <ol className="week-activity" aria-label={`${stats.activeDaysThisWeek} active days this week`}>
            {stats.weeklyActivity.map((day) => <li key={day.label} className={day.active ? "is-active" : ""}><span aria-hidden="true">{day.active ? "✓" : ""}</span>{day.label}</li>)}
          </ol>
          <p className="level-next-step">{stats.level.nextStep}</p>
        </article>

        <a className="home-link-panel" href="/videos">
          <p className="eyebrow">Videos</p>
          <h2>Watch debate lessons</h2>
          <span>Open videos</span>
        </a>

        <Link className="history-panel history-link-panel" href={stats.latestScore ? `/practices/${stats.latestScore.debateId}` : "/practices"}>
          <p className="eyebrow">Latest result</p>
          <h2>{stats.latestScore ? `${stats.latestScore.overall}/100` : "No score yet"}</h2>
          <p className="history-preview">
            {stats.latestScore?.feedback ??
              "Complete a bot debate and judge it to build your score history."}
          </p>
          <span className="history-open">{stats.latestScore ? "Open practice" : "View my practices"} →</span>
        </Link>

        <article className="progress-panel progress-chart-panel">
          <p className="eyebrow">Progress score</p>
          <h2>{stats.improvementTrend.label}</h2>
          {chart.length ? <><svg className="progress-chart" viewBox="0 0 300 100" role="img" aria-label="Comparable progress score over recent debates"><line x1="16" y1="86" x2="284" y2="86" /><line x1="16" y1="16" x2="16" y2="86" /><polyline points={chartPoints} />{chart.map((entry, index) => { const [x, y] = chartPoints.split(" ")[index].split(","); return <circle key={entry.id} cx={x} cy={y} r="4"><title>{`${entry.comparableScore}/100 · ${entry.division}`}</title></circle>; })}</svg><p>{chart.at(-1)?.comparableScore}/100 comparable score · Junior 1.00×, Senior 1.04×</p></> : <p>Finish a judged practice to start your progress chart.</p>}
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
