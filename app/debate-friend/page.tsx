"use client";

import { useState } from "react";
import { SiteShell } from "../SiteShell";
import { VoiceArgumentBox } from "../VoiceArgumentBox";
import { friends } from "../data";

export default function DebateFriendPage() {
  const [judged, setJudged] = useState(false);

  return (
    <SiteShell>
      <section className="section-block debate-tool">
        <div className="section-title">
          <p className="eyebrow">Challenge</p>
          <h2>Debate with a friend</h2>
        </div>
        <p className="tool-copy">
          Invite a friend, choose who speaks first, and keep the round between
          two people.
        </p>
        <div className="friend-pick-list">
          {friends.map((friend) => (
            <button key={friend.name} type="button">
              <strong>{friend.name}</strong>
              <span>{friend.status}</span>
            </button>
          ))}
        </div>
        <VoiceArgumentBox
          label="Round notes"
          placeholder="Add the motion, teams, and speaking order, or record it..."
        />
        <button className="primary-action" type="button">
          Start friend debate
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => setJudged(true)}
        >
          Judge and rank speakers
        </button>
        {judged ? (
          <aside className="ranking-card" aria-live="polite">
            <p className="eyebrow">Judge result</p>
            <h3>Your rank: Gold III</h3>
            <p>
              You won on clarity and response. Your friend was stronger on
              examples, so your next focus is adding specific evidence.
            </p>
          </aside>
        ) : null}
      </section>
    </SiteShell>
  );
}
