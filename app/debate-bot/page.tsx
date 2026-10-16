"use client";

import { useState } from "react";
import { SiteShell } from "../SiteShell";
import { ArgumentBox } from "../ArgumentBox";
import { debatePrompts } from "../data";
import { rememberLatestScore } from "../ProfileClientStats";
import type {
  DebateRecord,
  DebateScore,
  DebateSide,
  DebateTurn,
} from "../lib/debate-types";

type DebateResponse = {
  debate?: DebateRecord;
  turns?: DebateTurn[];
  error?: string;
};

type JudgeResponse = {
  score?: DebateScore;
  error?: string;
};

export default function DebateBotPage() {
  const [motion, setMotion] = useState(debatePrompts[0]);
  const [side, setSide] = useState<DebateSide>("for");
  const [argument, setArgument] = useState("");
  const [debate, setDebate] = useState<DebateRecord | null>(null);
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [score, setScore] = useState<DebateScore | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isJudging, setIsJudging] = useState(false);

  async function startDebate() {
    setError("");
    setScore(null);
    setDebate(null);
    setTurns([]);
    setIsStarting(true);
    setStatus("Starting debate...");

    try {
      const response = await fetch("/api/debate-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion, side, argument }),
      });
      const data = (await response.json()) as DebateResponse;

      if (!response.ok || data.error || !data.debate || !data.turns) {
        throw new Error(data.error ?? "Could not start debate.");
      }

      setDebate(data.debate);
      setTurns(data.turns);
      setStatus("Bot response saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start debate.");
      setStatus("");
    } finally {
      setIsStarting(false);
    }
  }

  async function judgeCurrentDebate() {
    if (!debate) {
      setError("Start a bot debate before judging.");
      return;
    }

    setError("");
    setIsJudging(true);
    setStatus("Judging debate...");

    try {
      const response = await fetch("/api/debate-bot/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debateId: debate.id }),
      });
      const data = (await response.json()) as JudgeResponse;

      if (!response.ok || data.error || !data.score) {
        throw new Error(data.error ?? "Could not judge debate.");
      }

      setScore(data.score);
      rememberLatestScore(data.score);
      setStatus("Score saved to profile.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not judge debate.");
      setStatus("");
    } finally {
      setIsJudging(false);
    }
  }

  return (
    <SiteShell>
      <section className="section-block debate-tool">
        <div className="section-title">
          <p className="eyebrow">Practice</p>
          <h2>Debate with bot</h2>
        </div>
        <p className="tool-copy">
          Choose a motion and side, write your opening argument, and get a bot response.
        </p>
        <div className="motion-list">
          {debatePrompts.map((prompt) => (
            <button
              aria-pressed={motion === prompt}
              className={motion === prompt ? "selected-option" : ""}
              key={prompt}
              onClick={() => setMotion(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="side-toggle" aria-label="Choose side">
          <button
            aria-pressed={side === "for"}
            className={side === "for" ? "selected-option" : ""}
            onClick={() => setSide("for")}
            type="button"
          >
            For
          </button>
          <button
            aria-pressed={side === "against"}
            className={side === "against" ? "selected-option" : ""}
            onClick={() => setSide("against")}
            type="button"
          >
            Against
          </button>
        </div>
        <ArgumentBox
          label="Your argument"
          onChange={setArgument}
          placeholder="Write your opening argument..."
          value={argument}
        />
        <button
          className="primary-action"
          disabled={isStarting || isJudging}
          onClick={startDebate}
          type="button"
        >
          {isStarting ? "Starting..." : "Start bot debate"}
        </button>
        <button
          className="secondary-action"
          disabled={isStarting || isJudging || !debate}
          onClick={judgeCurrentDebate}
          type="button"
        >
          {isJudging ? "Judging..." : "Judge and rank me"}
        </button>
        {status ? (
          <p className="voice-status" aria-live="polite">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="error-message" aria-live="assertive">
            {error}
          </p>
        ) : null}
        {turns.length ? (
          <div className="turn-list" aria-label="Debate history">
            {turns.map((turn) => (
              <article className="turn-card" key={turn.id}>
                <p className="eyebrow">{turn.speaker === "user" ? "You" : "Bot"}</p>
                <p>{turn.content}</p>
              </article>
            ))}
          </div>
        ) : null}
        {score ? (
          <aside className="ranking-card" aria-live="polite">
            <p className="eyebrow">Judge result</p>
            <h3>Rank: {score.rank}</h3>
            <div className="score-grid">
              <span>Structure {score.structure}/10</span>
              <span>Logic {score.logic}/10</span>
              <span>Evidence {score.evidence}/10</span>
              <span>Rebuttal {score.rebuttal}/10</span>
              <span>Style {score.speakingStyle}/10</span>
              <strong>{score.overall}/100</strong>
            </div>
            <p>{score.feedback}</p>
          </aside>
        ) : null}
      </section>
    </SiteShell>
  );
}
