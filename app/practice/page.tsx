import Link from "next/link";
import { SiteShell } from "../SiteShell";
import { getCurrentUserState } from "../lib/current-user";
import { listPractices } from "../lib/debate-store";

const dateFormatter = new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });

export default async function PracticeModesPage() {
  const { user } = await getCurrentUserState();
  const practices = await listPractices(user.userId);
  const recentPractices = practices.slice(0, 3);

  return <SiteShell><section className="mode-picker"><div><p className="eyebrow">Practice</p><h1>Choose how to debate</h1><p>Start solo with an AI partner, or prepare for live practice with another student.</p></div><div className="mode-grid"><Link href="/debate-bot" className="mode-card"><p className="eyebrow">Available now</p><h2>Solo practice</h2><p>Build a three-speech case and get personal feedback.</p><span>Start solo practice</span></Link><div className="mode-card is-coming"><p className="eyebrow">Coming soon</p><h2>Live practice</h2><p>Pair with another student for a structured debate.</p><span>In development</span></div></div></section>{practices.length > 0 && <section className="recent-practices"><div className="section-heading"><div><p className="eyebrow">My practices</p><h2>Continue where you left off</h2></div><Link href="/practices" className="text-action">View all</Link></div><div className="recent-practice-list">{recentPractices.map(({ debate, speeches, score }) => <Link key={debate.id} href={`/practices/${debate.id}`} className="recent-practice-row"><time dateTime={debate.createdAt}>{dateFormatter.format(new Date(debate.createdAt))}</time><span className="recent-practice-topic">{debate.motion}</span><span className={`practice-status ${score ? "is-complete" : ""}`}>{score ? `${score.overall}/100` : `${speeches}/3 speeches`}</span></Link>)}</div></section>}</SiteShell>;
}
