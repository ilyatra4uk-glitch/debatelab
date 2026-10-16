import Link from "next/link";
import { SiteShell } from "../SiteShell";
import { getCurrentUserState } from "../lib/current-user";
import { listPractices } from "../lib/debate-store";

export default async function PracticesPage() {
  const { user } = await getCurrentUserState();
  const practices = await listPractices(user.userId);
  return <SiteShell><div className="page-heading"><div><p className="eyebrow">Your learning journal</p><h1>My practices</h1><p>Continue a round or revisit what you learned.</p></div><Link className="primary-link-action" href="/debate-bot">New practice →</Link></div>
    {!practices.length ? <section className="section-block empty-practices"><h2>Your first practice starts with one idea.</h2><p>Pick a topic, make your case, and get a little better with each round. Your practices will be saved here.</p><Link className="primary-link-action" href="/debate-bot">Try my first round</Link></section> : <div className="practice-list">{practices.map(({ debate, speeches, score }) => <Link href={`/practices/${debate.id}`} className="practice-card" key={debate.id}><div className="practice-card-meta"><span className={`practice-status ${score !== null ? "is-complete" : ""}`}>{score !== null ? "Feedback ready" : speeches >= 3 ? "Ready for feedback" : "In progress"}</span><time dateTime={debate.createdAt}>{new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" }).format(new Date(debate.createdAt))}</time></div><h2>{debate.motion}</h2><p>{debate.side === "for" ? "For" : "Against"} the motion · {speeches} of 3 speeches</p><span className="practice-open">{score !== null ? "Read feedback" : speeches >= 3 ? "Get feedback" : "Continue round"} →</span></Link>)}</div>}
  </SiteShell>;
}
