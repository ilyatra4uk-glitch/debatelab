"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteShell } from "./SiteShell";
import { TopicPicker } from "./TopicPicker";
import { debateTopics } from "./lib/debate-topics";
import type { DebateSide, PracticeDetail } from "./lib/debate-types";

const stages = [
  { title: "Make your case", instruction: "Give one or two reasons for your position and add an example.", hint: "Try: I believe… because… For example… This matters because…" },
  { title: "Answer the challenge", instruction: "Choose the bot’s strongest point. Explain why you disagree and support your reply.", hint: "Try: You argue that… However… My example shows…" },
  { title: "Bring it together", instruction: "Answer the bot’s question, then explain why your position is stronger. Keep your conclusion focused.", hint: "Try: To answer your question… The most important difference is… That is why…" },
];

export function PracticeClient({ initial = null, previousScore = null }: { initial?: PracticeDetail | null; previousScore?: number | null }) {
  const router = useRouter();
  const [practice, setPractice] = useState<PracticeDetail | null>(initial);
  const [motion, setMotion] = useState(initial?.debate.motion ?? debateTopics[0].motion);
  const [side, setSide] = useState<DebateSide>(initial?.debate.side ?? "for");
  const [speech, setSpeech] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [turnId, setTurnId] = useState(initial?.turns.find((turn) => turn.speaker === "user")?.id ?? "");
  const [revision, setRevision] = useState("");
  const speeches = practice?.turns.filter((turn) => turn.speaker === "user") ?? [];
  const step = speeches.length;
  const finished = step >= 3 || !!practice?.score;
  const stage = stages[Math.min(step, 2)];
  const score = practice?.score;

  async function sendSpeech(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setStatus("Your debate partner is thinking…");
    try {
      const response = await fetch("/api/debate-bot", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion, side, argument: speech, debateId: practice?.debate.id, expectedTurns: practice?.turns.length ?? 0 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not send your speech.");
      setPractice(data); setSpeech("");
      setTurnId(data.turns.find((turn: { speaker: string }) => turn.speaker === "user")?.id ?? "");
      setStatus(data.turns.length >= 6 ? "Round finished. Your feedback is ready to request." : "Speech saved. Read the reply and take your time with the next step.");
      if (!practice) router.replace(`/practices/${data.debate.id}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setStatus(""); }
    finally { setBusy(false); }
  }

  async function getFeedback() {
    if (!practice || busy) return;
    setBusy(true); setError(""); setStatus("Your coach is reviewing all three speeches…");
    try {
      const response = await fetch("/api/debate-bot/judge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId: practice.debate.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not get feedback.");
      setPractice({ ...practice, score: data.score, debate: { ...practice.debate, status: "judged" } });
      setStatus("Feedback saved to My practices.");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setStatus(""); }
    finally { setBusy(false); }
  }

  async function submitRevision(event: React.FormEvent) {
    event.preventDefault();
    if (!practice || busy) return;
    setBusy(true); setError(""); setStatus("Your coach is comparing your two versions…");
    try {
      const response = await fetch(`/api/practices/${practice.debate.id}/revision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turnId, content: revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not review your rewrite.");
      setPractice({ ...practice, revisions: [...practice.revisions, data.revision] });
      setEditing(false); setRevision(""); setStatus("Your improved version and feedback are saved.");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setStatus(""); }
    finally { setBusy(false); }
  }

  return <SiteShell>
    <div className="page-heading"><div><p className="eyebrow">Practice · about 5–8 minutes</p><h1>{practice ? "Your debate" : "A new perspective starts here"}</h1><p>Three short speeches. One clear next step.</p></div><Link className="secondary-link-action" href="/practices">My practices →</Link></div>
    <section className="section-block debate-tool">
      <ol className="round-progress" aria-label="Round progress">{stages.map((item,index) => <li key={item.title} aria-current={!finished && index === step ? "step" : undefined} className={index < step ? "step-done" : ""}><span>{index < step ? "✓" : index + 1}</span>{item.title}</li>)}</ol>
      {!practice ? <><TopicPicker motion={motion} onChange={setMotion} disabled={busy} /><fieldset className="side-choice" disabled={busy}><legend>Your side</legend><div className="side-toggle">{(["for", "against"] as const).map((value) => <button key={value} type="button" aria-pressed={side === value} className={side === value ? "selected-option" : ""} onClick={() => setSide(value)}>{value === "for" ? "For the motion" : "Against the motion"}</button>)}</div></fieldset></> : <div className="selected-topic"><span className="eyebrow">Your motion · {practice.debate.side === "for" ? "For" : "Against"}</span><strong>{practice.debate.motion}</strong><span className="tool-copy">Saved automatically after each exchange. You can return from My practices.</span></div>}
      {practice && <div className="turn-list" aria-label="Your debate">{practice.turns.map((turn,index) => <article key={turn.id} className={`turn-card ${turn.speaker === "bot" ? "bot-turn" : ""}`}><p className="eyebrow">{turn.speaker === "user" ? "You" : "Debate partner"} · {stages[Math.floor(index / 2)]?.title ?? "Previous exchange"}</p><p>{turn.content}</p></article>)}</div>}
      {!finished && <form onSubmit={sendSpeech} className="speech-form"><div><p className="eyebrow">Step {step + 1} of 3</p><h2>{stage.title}</h2><p className="tool-copy">{stage.instruction}</p></div><label className="debate-field">Your speech<textarea value={speech} onChange={(event) => setSpeech(event.target.value)} minLength={20} maxLength={6000} required disabled={busy} placeholder="Take your time. A clear reason and a useful example are a good start." /></label><div className="speech-meta"><details><summary>Need a starting point?</summary><p>{stage.hint}</p></details><span>{speech.trim().split(/\s+/).filter(Boolean).length} words</span></div><button className="primary-action" disabled={busy} type="submit">{busy ? "Thinking…" : step === 0 ? "Send opening speech" : step === 1 ? "Send rebuttal" : "Finish with my conclusion"}</button><p className="tool-copy">No timer. Short and clear is better than long and complicated.</p></form>}
      {finished && !score && <div className="round-complete"><h2>You finished your round.</h2><p>Let’s find what worked and one thing to try next.</p><button className="primary-action" disabled={busy} onClick={getFeedback}>{busy ? "Reviewing…" : "Get my feedback"}</button></div>}
      {score && <aside className="ranking-card"><p className="eyebrow">Your next step</p><h2>A little better, every round.</h2><p className="feedback-copy">{score.feedback}</p>{previousScore !== null && <p className="progress-note">{score.overall > previousScore ? `Your score is ${score.overall - previousScore} points higher than your previous completed round.` : "You have another round of practice behind you. Focus on the next step above."}</p>}<button className="secondary-action" disabled={busy} onClick={() => { setEditing(!editing); const original = speeches.find((turn) => turn.id === turnId) ?? speeches[0]; if (original) { setTurnId(original.id); setRevision(original.content); } }}>{editing ? "Close rewrite" : "Improve one speech"}</button><details className="score-details"><summary>View skill scores</summary><p>These are practice indicators, not a school grade. Style means written clarity.</p><div className="score-grid"><span>Structure {score.structure}/10</span><span>Logic {score.logic}/10</span><span>Examples {score.evidence}/10</span><span>Responding {score.rebuttal}/10</span><span>Clarity {score.speakingStyle}/10</span><strong>{score.overall}/100</strong></div></details></aside>}
      {editing && score && <form className="speech-form revision-form" onSubmit={submitRevision}><h2>Try a stronger version</h2><label className="debate-field">Choose your speech<select disabled={busy} value={turnId} onChange={(event) => { setTurnId(event.target.value); setRevision(speeches.find((turn) => turn.id === event.target.value)?.content ?? ""); }}>{speeches.map((turn,index) => <option key={turn.id} value={turn.id}>{stages[index]?.title ?? `Speech ${index+1}`}</option>)}</select></label><p className="tool-copy">Use your feedback to improve this speech. Your original round and score stay available.</p><label className="debate-field">Your improved speech<textarea disabled={busy} value={revision} onChange={(event) => setRevision(event.target.value)} minLength={20} maxLength={6000} required /></label><button className="primary-action" disabled={busy}>{busy ? "Reviewing…" : "Get feedback on my rewrite"}</button></form>}
      {!!practice?.revisions.length && <section className="revision-history"><h2>Your improvements</h2>{practice.revisions.map((item,index) => <article className="turn-card" key={item.id}><p className="eyebrow">Rewrite {index + 1}</p><p>{item.content}</p><div className="revision-feedback">{item.feedback}</div></article>)}</section>}
      {status && <p className="voice-status" role="status">{status}</p>}{error && <p className="error-message" role="alert">{error}</p>}
      {finished && <Link href="/debate-bot" className="primary-link-action">Start a new practice →</Link>}
    </section>
  </SiteShell>;
}
