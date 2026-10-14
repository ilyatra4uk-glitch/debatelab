"use client";

import { useState } from "react";
import { SiteShell } from "../SiteShell";

const focusAreas = [
  "Argument structure",
  "Logic",
  "Evidence",
  "Rebuttal",
  "Speaking style",
];

type TrainingMode = "focused" | "test";

type RegisterResponse = {
  emailSent?: boolean;
  user?: {
    displayName: string;
    email: string;
  };
  error?: string;
};

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [trainingMode, setTrainingMode] = useState<TrainingMode>("test");
  const [focusArea, setFocusArea] = useState(focusAreas[0]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("Creating profile...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          level,
          goal: trainingMode === "test" ? "Diagnostic test debate" : focusArea,
        }),
      });
      const data = (await response.json()) as RegisterResponse;

      if (!response.ok || data.error || !data.user) {
        throw new Error(data.error ?? "Could not create profile.");
      }

      if (data.emailSent) {
        setStatus("Profile created. Check your email for your DebateLab magic link.");
      } else {
        window.localStorage.setItem(
          "debateLabRegistration",
          JSON.stringify({ ...data.user, level, trainingMode, focusArea }),
        );
        setStatus("Profile created. Opening your dashboard...");
        const nextPath =
          trainingMode === "test"
            ? "/debate-bot?mode=test"
            : `/debate-bot?focus=${encodeURIComponent(focusArea)}`;
        window.location.href = nextPath;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create profile.");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <section className="section-block register-panel">
        <div className="section-title">
          <p className="eyebrow">Join DebateLab</p>
          <h2>Create your speaker profile</h2>
        </div>
        <form className="register-form" onSubmit={submitRegistration}>
          <label className="debate-field">
            <span>Name</span>
            <input
              autoComplete="name"
              name="displayName"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ilya K."
              required
              value={displayName}
            />
          </label>
          <label className="debate-field">
            <span>Email</span>
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="debate-field">
            <span>Current level</span>
            <select
              name="level"
              onChange={(event) => setLevel(event.target.value)}
              value={level}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <fieldset className="training-choice">
            <legend>How should DebateLab start?</legend>
            <button
              aria-pressed={trainingMode === "test"}
              className={trainingMode === "test" ? "selected-option" : ""}
              onClick={() => setTrainingMode("test")}
              type="button"
            >
              <strong>Test debate</strong>
              <span>Let the judge diagnose your level and weakest area.</span>
            </button>
            <button
              aria-pressed={trainingMode === "focused"}
              className={trainingMode === "focused" ? "selected-option" : ""}
              onClick={() => setTrainingMode("focused")}
              type="button"
            >
              <strong>Focused training</strong>
              <span>Pick one area and practice it from the first debate.</span>
            </button>
          </fieldset>
          {trainingMode === "focused" ? (
            <label className="debate-field">
              <span>Area to improve</span>
              <select
                name="focusArea"
                onChange={(event) => setFocusArea(event.target.value)}
                value={focusArea}
              >
                {focusAreas.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create profile"}
          </button>
        </form>
        <a className="inline-link" href="/login">
          Already have a profile? Log in
        </a>
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
      </section>
    </SiteShell>
  );
}
