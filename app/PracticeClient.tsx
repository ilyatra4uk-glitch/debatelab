"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteShell } from "./SiteShell";
import { TopicPicker } from "./TopicPicker";
import { debateTopics, pickRandomTopic } from "./lib/debate-topics";
import type { DebateSide, PracticeDetail } from "./lib/debate-types";

const stages = [
  { title: "Make your case", instruction: "Give one reason and an example." },
  { title: "Answer the challenge", instruction: "Reply to the strongest point from the other side." },
  { title: "Bring it together", instruction: "Explain why your side is stronger overall." },
  { title: "Get feedback", instruction: "See your result and one useful next step." },
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
  const score = practice?.score;
  const finished = step >= 3 || Boolean(score);
  const activeStage = score ? 4 : step + 1;
  const currentMotion = practice?.debate.motion ?? motion;
  const currentSide = practice?.debate.side ?? side;
  const stage = stages[Math.min(step, 2)];

  useEffect(() => {
    if (!initial) setMotion(pickRandomTopic(debateTopics).motion);
  }, [initial]);

  async function sendSpeech(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setStatus("Your debate partner is thinking…");
    try {
      const response = await fetch("/api/debate-bot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motion, side, argument: speech, debateId: practice?.debate.id, expectedTurns: practice?.turns.length ?? 0 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not send your speech.");
      setPractice(data); setSpeech("");
      setTurnId(data.turns.find((turn: { speaker: string }) => turn.speaker === "user")?.id ?? "");
      setStatus(data.turns.length >= 6 ? "Round complete. Get your feedback when you are ready." : "Speech saved.");
      if (!practice) router.replace(`/practices/${data.debate.id}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setStatus(""); }
    finally { setBusy(false); }
  }

  async function getFeedback() {
    if (!practice || busy) return;
    setBusy(true); setError(""); setStatus("Your coach is reviewing your debate…");
    try {
      const response = await fetch("/api/debate-bot/judge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId: practice.debate.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not get feedback.");
      setPractice({ ...practice, score: data.score, debate: { ...practice.debate, status: "judged" } });
      setStatus("Feedback saved.");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setStatus(""); }
    finally { setBusy(false); }
  }

  async function submitRevision(event: React.FormEvent) {
    event.preventDefault();
    if (!practice || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/practices/${practice.debate.id}/revision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turnId, content: revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not review your rewrite.");
      setPractice({ ...practice, revisions: [...practice.revisions, data.revision] });
      setEditing(false); setRevision(""); setStatus("Your improved version is saved.");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return <SiteShell><div className="practice-layout">
    <aside className="practice-sidebar">
      <Link className="back-link" href="/practices">← My practices</Link>
      <div><p className="eyebrow">Your practice</p><h1>Practice</h1></div>
      <ol className="practice-steps" aria-label="Practice steps">{stages.map((item, index) => <li key={item.title} className={index + 1 < activeStage ? "is-done" : index + 1 === activeStage ? "is-current" : ""}><span>{index + 1 < activeStage ? "✓" : index + 1}</span>{item.title}</li>)}</ol>
      <dl className="practice-meta"><div><dt>Topic</dt><dd>{currentMotion}</dd></div><div><dt>Your side</dt><dd>{currentSide === "for" ? "For the motion" : "Against the motion"}</dd></div><div><dt>Progress</dt><dd>{step} of 3 speeches</dd></div>{score && <div><dt>Result</dt><dd>{score.overall}/100</dd></div>}</dl>
    </aside>
    <main className="practice-main">
      {!practice && <section className="practice-setup"><p className="eyebrow">Random topic</p><h2>{motion}</h2><TopicPicker motion={motion} onChange={setMotion} disabled={busy} /><fieldset className="side-choice" disabled={busy}><legend>Choose your side</legend><div className="side-toggle">{(["for", "against"] as const).map((value) => <button key={value} type="button" aria-pressed={side === value} className={side === value ? "selected-option" : ""} onClick={() => setSide(value)}>{value === "for" ? "For" : "Against"}</button>)}</div></fieldset></section>}
      {practice && <div className="turn-list" aria-label="Your debate">{practice.turns.map((turn, index) => <article key={turn.id} className={`turn-card ${turn.speaker === "bot" ? "bot-turn" : ""}`}><p className="eyebrow">{turn.speaker === "user" ? "You" : "Debate partner"} · {stages[Math.floor(index / 2)].title}</p><p>{turn.content}</p></article>)}</div>}
      {!finished && <form onSubmit={sendSpeech} className="speech-form"><div><p className="eyebrow">Step {step + 1}</p><h2>{stage.title}</h2><p className="tool-copy">{stage.instruction}</p></div><label className="debate-field">Your speech<textarea value={speech} onChange={(event) => setSpeech(event.target.value)} minLength={20} maxLength={6000} required disabled={busy} placeholder="Write your argument here…" /></label><div className="speech-meta"><span>{speech.trim().split(/\s+/).filter(Boolean).length} words</span></div><button className="primary-action" disabled={busy} type="submit">{busy ? "Thinking…" : step === 2 ? "Finish my debate" : "Send speech"}</button></form>}
      {finished && !score && <div className="round-complete"><h2>Round complete</h2><p>Your three speeches are ready for feedback.</p><button className="primary-action" disabled={busy} onClick={getFeedback}>{busy ? "Reviewing…" : "Get feedback"}</button></div>}
      {score && <aside className="ranking-card"><p className="eyebrow">Your result</p><h2>{score.overall}/100</h2><p className="feedback-copy">{score.feedback}</p>{previousScore !== null && <p className="progress-note">{score.overall > previousScore ? `+${score.overall - previousScore} points from your previous completed round.` : "Keep practising: the next round is another chance to improve."}</p>}<button className="secondary-action" disabled={busy} onClick={() => { setEditing(!editing); const original = speeches.find((turn) => turn.id === turnId) ?? speeches[0]; if (original) { setTurnId(original.id); setRevision(original.content); } }}>{editing ? "Close rewrite" : "Improve a speech"}</button><details className="score-details"><summary>Skill scores</summary><div className="score-grid"><span>Structure {score.structure}/10</span><span>Logic {score.logic}/10</span><span>Examples {score.evidence}/10</span><span>Responding {score.rebuttal}/10</span><span>Clarity {score.speakingStyle}/10</span></div></details></aside>}
      {editing && score && <form className="speech-form revision-form" onSubmit={submitRevision}><h2>Improve one speech</h2><label className="debate-field">Speech<select disabled={busy} value={turnId} onChange={(event) => { setTurnId(event.target.value); setRevision(speeches.find((turn) => turn.id === event.target.value)?.content ?? ""); }}>{speeches.map((turn, index) => <option key={turn.id} value={turn.id}>{stages[index].title}</option>)}</select></label><label className="debate-field">Your improved version<textarea disabled={busy} value={revision} onChange={(event) => setRevision(event.target.value)} minLength={20} maxLength={6000} required /></label><button className="primary-action" disabled={busy}>{busy ? "Reviewing…" : "Save improvement"}</button></form>}
      {!!practice?.revisions.length && <section className="revision-history"><h2>Your improvements</h2>{practice.revisions.map((item, index) => <article className="turn-card" key={item.id}><p className="eyebrow">Rewrite {index + 1}</p><p>{item.content}</p><div className="revision-feedback">{item.feedback}</div></article>)}</section>}
      {status && <p className="voice-status" role="status">{status}</p>}{error && <p className="error-message" role="alert">{error}</p>}
      {score && <Link href="/debate-bot" className="primary-link-action">Start a new practice</Link>}
    </main>
  </div></SiteShell>;
}
