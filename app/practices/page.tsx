import Link from "next/link";
import { SiteShell } from "../SiteShell";
import { getCurrentUserState } from "../lib/current-user";
import { listPractices } from "../lib/debate-store";
import type { DebateScore } from "../lib/debate-types";

const dateFormatter = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Dublin",
});

function statusFor(speeches: number, score: DebateScore | null) {
  if (score) return "Complete";
  if (speeches >= 3) return "Ready for feedback";
  return "In progress";
}

function ScoreCell({ score }: { score: DebateScore | null }) {
  if (!score) return <span className="practice-no-score">—</span>;

  return <div className="practice-score">
    <strong>{score.overall}/100</strong>
    <span>Structure {score.structure} · Logic {score.logic} · Examples {score.evidence} · Reply {score.rebuttal} · Clarity {score.speakingStyle}</span>
  </div>;
}

export default async function PracticesPage() {
  const { user } = await getCurrentUserState();
  const practices = await listPractices(user.userId);
  return <SiteShell>
    <div className="page-heading">
      <div><p className="eyebrow">Your learning journal</p><h1>My practices</h1><p>Continue a round or revisit what you learned.</p></div>
      <Link className="primary-link-action" href="/debate-bot">New practice</Link>
    </div>
    {!practices.length ? <section className="section-block empty-practices">
      <h2>Your first practice starts with one idea.</h2>
      <p>Pick a topic, make your case, and get a little better with each round. Your practices will be saved here.</p>
      <Link className="primary-link-action" href="/debate-bot">Try my first round</Link>
    </section> : <div className="practice-table-wrap">
      <table className="practice-table">
        <caption className="sr-only">Saved debate practices</caption>
        <thead><tr><th>Date</th><th>Topic</th><th>Status</th><th>Score</th><th><span className="sr-only">Open practice</span></th></tr></thead>
        <tbody>{practices.map(({ debate, speeches, score }) => {
          const status = statusFor(speeches, score);
          const action = score ? "View feedback" : speeches >= 3 ? "Get feedback" : "Continue";
          return <tr key={debate.id}>
            <td className="practice-date"><time dateTime={debate.createdAt}>{dateFormatter.format(new Date(debate.createdAt))}</time></td>
            <td><Link href={`/practices/${debate.id}`} className="practice-topic">{debate.motion}<span>{debate.side === "for" ? "For" : "Against"} the motion · {speeches} of 3 speeches</span></Link></td>
            <td><span className={`practice-status ${score ? "is-complete" : ""}`}>{status}</span></td>
            <td><ScoreCell score={score} /></td>
            <td><Link href={`/practices/${debate.id}`} className="practice-row-action">{action}</Link></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </SiteShell>;
}
