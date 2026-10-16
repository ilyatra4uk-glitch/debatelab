"use client";

import { useState } from "react";

type RankingEntry = { name: string; login: string | null; practices: number; averageScore: number | null; streak: number; isYou?: boolean };

export function CommunityRanking({ entries, activityRank, streakRank }: { entries: RankingEntry[]; activityRank: number; streakRank: number }) {
  const [open, setOpen] = useState(false);
  const ranked = [...entries].sort((a, b) => b.practices - a.practices || (b.averageScore ?? -1) - (a.averageScore ?? -1) || a.name.localeCompare(b.name));
  return <><button className="leaderboard-panel ranking-panel-button" onClick={() => setOpen(true)}><p className="eyebrow">Community ranking</p><div className="ranking-metrics"><div><span>Most practices</span><strong>#{activityRank}</strong></div><div><span>Best streak</span><strong>#{streakRank}</strong></div></div></button>{open && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><section className="friends-ranking-dialog" role="dialog" aria-modal="true" aria-labelledby="friends-ranking-title" onMouseDown={(event) => event.stopPropagation()}><button className="dialog-close" aria-label="Close" onClick={() => setOpen(false)}>×</button><p className="eyebrow">Community ranking</p><h2 id="friends-ranking-title">You and your friends</h2><ol className="friends-ranking-list">{ranked.map((entry, index) => <li key={`${entry.name}-${entry.login ?? ""}`}><span className="friends-rank-number">#{index + 1}</span><div className="friends-rank-person"><strong>{entry.name}{entry.isYou ? " (You)" : ""}</strong><span>{entry.login ? `@${entry.login}` : "DebateLab member"}</span></div><div className="friends-rank-stats"><span>{entry.practices} practices</span><span>{entry.averageScore ?? "—"} avg.</span><span>{entry.streak}-day streak</span></div></li>)}</ol></section></div>}</>;
}
