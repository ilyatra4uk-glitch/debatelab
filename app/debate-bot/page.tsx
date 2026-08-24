"use client";

import { useState } from "react";
import { SiteShell } from "../SiteShell";
import { debatePrompts } from "../data";

export default function DebateBotPage() {
  const [judged, setJudged] = useState(false);

  return (
    <SiteShell>
      <section className="section-block debate-tool">
        <div className="section-title">
          <p className="eyebrow">Practice</p>
          <h2>Debate with bot</h2>
        </div>
        <p className="tool-copy">
          Pick a world-level motion, prepare your side, and use the bot as a
          sparring partner.
        </p>
        <div className="motion-list">
          {debatePrompts.map((prompt) => (
            <button key={prompt} type="button">
              {prompt}
            </button>
          ))}
        </div>
        <label className="debate-field">
          <span>Your argument</span>
          <textarea placeholder="Write your opening argument..." />
        </label>
        <button className="primary-action" type="button">
          Start bot debate
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => setJudged(true)}
        >
          Judge and rank me
        </button>
        {judged ? (
          <aside className="ranking-card" aria-live="polite">
            <p className="eyebrow">Judge result</p>
            <h3>Rank: Silver II</h3>
            <p>
              You are strongest at structure. To move up, add sharper rebuttal
              and compare your impact against the bot&apos;s case.
            </p>
          </aside>
        ) : null}
      </section>
    </SiteShell>
  );
}
