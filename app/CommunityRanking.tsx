"use client";

import { useState } from "react";

type RankingEntry = { userId: string; name: string; login: string | null; practices: number; averageScore: number | null; streak: number; isYou?: boolean };
type Criterion = "practices" | "streak";

export function CommunityRanking({ entries, leaders, activityRank, streakRank }: { entries: RankingEntry[]; leaders: Record<Criterion, RankingEntry | null>; activityRank: number; streakRank: number }) {
  const [open, setOpen] = useState(false);
  const [criterion, setCriterion] = useState<Criterion>("practices");
  const leader = leaders[criterion];
  const knownLeader = leader && entries.some((entry) => entry.userId === leader.userId);
  const rows = [
    ...entries,
    ...(leader && !knownLeader ? [{ ...leader, name: "Community leader", login: null }] : []),
  ].sort((a, b) => criterion === "practices" ? b.practices - a.practices || b.streak - a.streak || a.name.localeCompare(b.name) : b.streak - a.streak || b.practices - a.practices || a.name.localeCompare(b.name));

  return <><button className="leaderboard-panel ranking-panel-button" onClick={() => setOpen(true)}><p className="eyebrow">Community ranking</p><div className="ranking-metrics"><div><span>Most practices</span><strong>#{activityRank}</strong></div><div><span>Best streak</span><strong>#{streakRank}</strong></div></div></button>{open && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><section className="friends-ranking-dialog" role="dialog" aria-modal="true" aria-labelledby="friends-ranking-title" onMouseDown={(event) => event.stopPropagation()}><button className="dialog-close" aria-label="Close" onClick={() => setOpen(false)}>×</button><p className="eyebrow">Scoreboard</p><h2 id="friends-ranking-title">You and your friends</h2><div className="scoreboard-tabs" role="tablist" aria-label="Ranking criterion"><button aria-selected={criterion === "practices"} role="tab" onClick={() => setCriterion("practices")}>Most practices</button><button aria-selected={criterion === "streak"} role="tab" onClick={() => setCriterion("streak")}>Best streak</button></div><div className="scoreboard-table-wrap"><table className="scoreboard-table"><thead><tr><th>Place</th><th>Player</th><th>Practices</th><th>Streak</th></tr></thead><tbody>{rows.map((entry, index) => <tr className={entry.isYou ? "is-you" : ""} key={entry.userId}><td>#{index + 1}</td><td><strong>{entry.name}{entry.isYou ? " (You)" : ""}</strong>{entry.login && <span>@{entry.login}</span>}</td><td>{entry.practices}</td><td>{entry.streak} days</td></tr>)}</tbody></table></div></section></div>}</>;
}
