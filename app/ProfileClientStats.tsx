"use client";

import { useSyncExternalStore } from "react";
import type { DebateScore } from "./lib/debate-types";

const latestScoreKey = "debateLabLatestScore";
let cachedRawScore: string | null = null;
let cachedScore: DebateScore | null = null;

export function rememberLatestScore(score: DebateScore) {
  window.localStorage.setItem(latestScoreKey, JSON.stringify(score));
}

export function ProfileClientStats() {
  const score = useSyncExternalStore(subscribeToLatestScore, getLatestScore, () => null);

  if (!score) return null;

  return (
    <article className="history-panel client-history-panel">
      <p className="eyebrow">Latest browser result</p>
      <h2>{score.overall}/100</h2>
      <p>{score.feedback}</p>
    </article>
  );
}

function subscribeToLatestScore(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getLatestScore(): DebateScore | null {
  const raw = window.localStorage.getItem(latestScoreKey);
  if (!raw) return null;
  if (raw === cachedRawScore) return cachedScore;

  try {
    cachedRawScore = raw;
    cachedScore = JSON.parse(raw) as DebateScore;
    return cachedScore;
  } catch {
    cachedRawScore = null;
    cachedScore = null;
    window.localStorage.removeItem(latestScoreKey);
    return null;
  }
}
