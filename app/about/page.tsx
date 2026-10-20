import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Debate practice for secondary students",
  description: "Practise structured debates, get AI feedback using the Korea WUDC speaker scale, and debate live with friends.",
  alternates: { canonical: "/about" },
  openGraph: { title: "DebateLab", description: "A debate practice space for secondary students.", url: "/about", siteName: "DebateLab", type: "website" },
};

export default function AboutPage() {
  return <main className="public-page"><header className="public-nav"><Link className="brand" href="/about"><img className="brand-mark" src="/favicon.svg" alt="" />DebateLab</Link><Link className="secondary-link-action" href="/login">Log in</Link></header><section className="public-hero"><p className="eyebrow">Debate practice for secondary students</p><h1>Think clearly. Speak with confidence.</h1><p>Practise a full debate, receive supportive feedback on the Korea WUDC speaker scale, and build a steady habit of speaking up.</p><div><Link className="primary-link-action" href="/register">Create your profile</Link><Link className="text-action" href="/login">I already have an account</Link></div></section><section className="public-features" aria-label="What DebateLab offers"><article><h2>Practise deliberately</h2><p>Work through opening, rebuttal and closing speeches with clear prompts.</p></article><article><h2>Get useful feedback</h2><p>See a holistic Korea WUDC speaker mark and one practical next step.</p></article><article><h2>Debate together</h2><p>Invite a friend to a live, turn-by-turn practice round.</p></article></section></main>;
}
