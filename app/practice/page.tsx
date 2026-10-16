import Link from "next/link";
import { SiteShell } from "../SiteShell";

export default function PracticeModesPage() {
  return <SiteShell><section className="mode-picker"><div><p className="eyebrow">Practice</p><h1>Choose how to debate</h1><p>Start solo with an AI partner, or prepare for live practice with another student.</p></div><div className="mode-grid"><Link href="/debate-bot" className="mode-card"><p className="eyebrow">Available now</p><h2>Solo practice</h2><p>Build a three-speech case and get personal feedback.</p><span>Start solo practice</span></Link><div className="mode-card is-coming"><p className="eyebrow">Coming soon</p><h2>Live practice</h2><p>Pair with another student for a structured debate.</p><span>In development</span></div></div></section></SiteShell>;
}
