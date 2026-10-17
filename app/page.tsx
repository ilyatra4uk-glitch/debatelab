import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "./SiteShell";
import { getCurrentUserState } from "./lib/current-user";
import { getOrCreateUser, getProfileStats } from "./lib/debate-store";
import { getCommunityLeaders, getFriendsData } from "./lib/friends-store";
import { CommunityRanking } from "./CommunityRanking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const { isRegistered, user: authUser } = await getCurrentUserState();
  if (!isRegistered) redirect("/login");
  const user = await getOrCreateUser(authUser);
  const stats = await getProfileStats(user.userId);
  const [{ friends }, communityLeaders] = await Promise.all([getFriendsData(user.userId), getCommunityLeaders()]);
  const chart = stats.progressHistory;
  const year = new Date().getFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const nextYearStart = Date.UTC(year + 1, 0, 1);
  const chartPoints = chart.map((entry) => {
    const timestamp = new Date(entry.createdAt).getTime();
    const x = 34 + Math.max(0, Math.min(1, (timestamp - yearStart) / (nextYearStart - yearStart))) * 250;
    const y = 78 - entry.comparableScore * 0.62;
    return `${x},${y}`;
  }).join(" ");
  const date = new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", timeZone: "Europe/Dublin" });
  const rankingEntries = [
    { userId: user.userId, name: user.displayName, login: null, practices: stats.debateCount, averageScore: stats.averageScore, streak: stats.currentStreak, isYou: true },
    ...friends.map((friend) => ({ userId: friend.userId, name: friend.displayName, login: friend.login, practices: friend.practiceCount, averageScore: friend.averageScore, streak: friend.currentStreak })),
  ];

  return <SiteShell>
    <div className="page-heading"><div><h1>Your progress</h1></div></div>
    <section className="dashboard-grid" aria-label="Learning dashboard">
      <article className="streak-panel">
        <div><p className="eyebrow">This week</p><h2>{stats.activeDaysThisWeek} of 7 days practised</h2><p>{stats.currentStreak ? `${stats.currentStreak}-day streak — keep it going.` : "Start a practice today to begin your streak."}</p></div>
        <div className="level-summary"><div><p className="eyebrow">Level</p><strong>{stats.level.label}</strong></div><div><p className="eyebrow">Rhythm</p><strong>{stats.practiceRhythm.label}</strong><span>{stats.practiceRhythm.activeDaysLast28} days in 28</span></div></div>
        <ol className="week-activity" aria-label={`${stats.activeDaysThisWeek} active days this week`}>{stats.weeklyActivity.map((day) => <li key={day.label} className={day.active ? "is-active" : ""}><span aria-hidden="true">{day.active ? "✓" : ""}</span>{day.label}</li>)}</ol>
        <Link className="level-next-step" href="/debate-bot">{stats.level.nextStep}</Link>
      </article>
      <article className="results-summary"><p className="eyebrow">Your results</p><div><strong>{stats.debateCount}</strong><span>debates</span></div><div><strong>{stats.averageScore ?? "—"}</strong><span>average score</span></div>{chart.length > 0 && <div className="result-progress"><span>Progress score · {year}</span><svg className="progress-chart" viewBox="0 0 300 94" role="img" aria-label={`Comparable progress score across ${year}, shown as a percentage`}><line x1="34" y1="78" x2="284" y2="78" /><line x1="34" y1="47" x2="284" y2="47" /><line x1="34" y1="16" x2="284" y2="16" /><text x="28" y="81">0%</text><text x="28" y="50">50%</text><text x="28" y="19">100%</text><polyline points={chartPoints} />{chart.map((entry, index) => { const [x, y] = chartPoints.split(" ")[index].split(","); return <circle key={entry.id} cx={x} cy={y} r="4"><title>{`${date.format(new Date(entry.createdAt))}: ${entry.comparableScore}% · ${entry.division}`}</title></circle>; })}</svg><div className="chart-labels chart-labels--year"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span></div></div>}</article>
      <CommunityRanking activityRank={stats.leaderboard.activityRank} currentStreak={stats.currentStreak} entries={rankingEntries} leaders={{ practices: communityLeaders.practices && { userId: communityLeaders.practices.userId, name: communityLeaders.practices.displayName, login: communityLeaders.practices.login, practices: communityLeaders.practices.practiceCount, averageScore: communityLeaders.practices.averageScore, streak: communityLeaders.practices.currentStreak }, streak: communityLeaders.streak && { userId: communityLeaders.streak.userId, name: communityLeaders.streak.displayName, login: communityLeaders.streak.login, practices: communityLeaders.streak.practiceCount, averageScore: communityLeaders.streak.averageScore, streak: communityLeaders.streak.currentStreak } }} />
      <Link className="history-panel history-link-panel" href={stats.latestScore ? `/practices/${stats.latestScore.debateId}` : "/practices"}><p className="eyebrow">Latest result</p><h2>{stats.latestScore ? `${stats.latestScore.overall}/100` : "No score yet"}</h2><p className="history-preview">{stats.latestScore?.feedback ?? "Complete a practice to see your latest feedback here."}</p><span className="history-open">{stats.latestScore ? "Open practice" : "View my practices"}</span></Link>
      <article className="progress-panel focus-panel"><p className="eyebrow">Focus next</p><h2>{stats.weakestSkill.label}{stats.weakestSkill.score ? ` ${stats.weakestSkill.score}/10` : ""}</h2><p>{stats.focusRecommendation}</p></article>
    </section>
  </SiteShell>;
}
