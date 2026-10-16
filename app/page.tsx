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
  const chart = stats.progressHistory;
  const chartPoints = chart.map((entry, index) => {
    const x = chart.length === 1 ? 150 : 16 + (index * 268) / (chart.length - 1);
    const y = 78 - entry.comparableScore * 0.62;
    return `${x},${y}`;
  }).join(" ");
  const date = new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", timeZone: "Europe/Dublin" });

  return <SiteShell>
    <div className="page-heading"><div><p className="eyebrow">Dashboard</p><h1>Your progress</h1><p>Keep your practice steady and make each argument clearer.</p></div></div>
    <Link className="journal-link" href="/practices">View my practices</Link>
    <section className="dashboard-grid" aria-label="Learning dashboard">
      <article className="streak-panel">
        <div><p className="eyebrow">This week</p><h2>{stats.activeDaysThisWeek} of 7 days practised</h2><p>{stats.currentStreak ? `${stats.currentStreak}-day streak — keep it going.` : "Start a practice today to begin your streak."}</p></div>
        <div className="level-summary"><div><p className="eyebrow">Level</p><strong>{stats.level.label}</strong></div><div><p className="eyebrow">Rhythm</p><strong>{stats.practiceRhythm.label}</strong><span>{stats.practiceRhythm.activeDaysLast28} days in 28</span></div></div>
        <ol className="week-activity" aria-label={`${stats.activeDaysThisWeek} active days this week`}>{stats.weeklyActivity.map((day) => <li key={day.label} className={day.active ? "is-active" : ""}><span aria-hidden="true">{day.active ? "✓" : ""}</span>{day.label}</li>)}</ol>
        <p className="level-next-step">{stats.level.nextStep}</p>
      </article>
      <article className="results-summary"><p className="eyebrow">Your results</p><div><strong>{stats.debateCount}</strong><span>debates</span></div><div><strong>{stats.averageScore ?? "—"}</strong><span>average score</span></div></article>
      <Link className="history-panel history-link-panel" href={stats.latestScore ? `/practices/${stats.latestScore.debateId}` : "/practices"}><p className="eyebrow">Latest result</p><h2>{stats.latestScore ? `${stats.latestScore.overall}/100` : "No score yet"}</h2><p className="history-preview">{stats.latestScore?.feedback ?? "Complete a practice to see your latest feedback here."}</p><span className="history-open">{stats.latestScore ? "Open practice" : "View my practices"}</span></Link>
      <article className="progress-panel progress-chart-panel"><p className="eyebrow">Progress score</p><h2>{stats.improvementTrend.label}</h2>{chart.length ? <><svg className="progress-chart" viewBox="0 0 300 94" role="img" aria-label="Comparable progress score over recent debates"><line x1="16" y1="78" x2="284" y2="78" /><line x1="16" y1="16" x2="16" y2="78" /><polyline points={chartPoints} />{chart.map((entry, index) => { const [x, y] = chartPoints.split(" ")[index].split(","); return <circle key={entry.id} cx={x} cy={y} r="4"><title>{`${date.format(new Date(entry.createdAt))}: ${entry.comparableScore}/100 · ${entry.division}`}</title></circle>; })}</svg><div className="chart-labels">{chart.map((entry) => <span key={entry.id}>{date.format(new Date(entry.createdAt))}</span>)}</div><p>{chart.at(-1)?.comparableScore}/100 comparable score · Junior 1.00×, Senior 1.04×</p></> : <p>Finish a judged practice to start your progress chart.</p>}</article>
      <article className="progress-panel focus-panel"><p className="eyebrow">Focus next</p><h2>{stats.weakestSkill.label}{stats.weakestSkill.score ? ` ${stats.weakestSkill.score}/10` : ""}</h2><p>{stats.focusRecommendation}</p></article>
    </section>
  </SiteShell>;
}
