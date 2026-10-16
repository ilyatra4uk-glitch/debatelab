import Link from "next/link";
import { SiteShell } from "../SiteShell";
import { getCurrentUserState } from "../lib/current-user";
import { listPractices } from "../lib/debate-store";
import type { DebateScore } from "../lib/debate-types";

const dateFormatter = new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });

function statusFor(speeches: number, score: DebateScore | null) {
  if (score) return "Complete";
  if (speeches >= 3) return "Ready for feedback";
  return "In progress";
}

function ScoreCell({ score }: { score: DebateScore | null }) {
  if (!score) return <span className="practice-no-score">—</span>;
  return <div className="practice-score"><strong>{score.overall}/100</strong><span>Structure {score.structure} · Logic {score.logic} · Examples {score.evidence} · Reply {score.rebuttal} · Clarity {score.speakingStyle}</span></div>;
}

export default async function PracticePage() {
  const { user } = await getCurrentUserState();
  const practices = await listPractices(user.userId);
  return <SiteShell><div className="page-heading"><p className="eyebrow">Practice</p><h1>My practices</h1></div>{!practices.length ? <section className="section-block empty-practices"><h2>No practices yet</h2><p>Start a debate from the button in the top navigation.</p></section> : <div className="practice-table-wrap"><table className="practice-table"><caption className="sr-only">Saved debate practices</caption><thead><tr><th>Date</th><th>Topic</th><th>Status</th><th>Score</th></tr></thead><tbody>{practices.map(({ debate, speeches, score }) => <tr key={debate.id}><td className="practice-date"><time dateTime={debate.createdAt}>{dateFormatter.format(new Date(debate.createdAt))}</time></td><td><Link href={`/practices/${debate.id}`} className="practice-topic">{debate.motion}<span>{debate.side === "for" ? "For" : "Against"} the motion · {speeches} of 3 speeches</span></Link></td><td><span className={`practice-status ${score ? "is-complete" : ""}`}>{statusFor(speeches, score)}</span></td><td><ScoreCell score={score} /></td></tr>)}</tbody></table></div>}</SiteShell>;
}
