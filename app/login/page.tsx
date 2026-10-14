"use client";

import { useState } from "react";
import { SiteShell } from "../SiteShell";

type LoginResponse = {
  emailSent?: boolean;
  expiresAt?: string;
  magicLink?: string;
  message?: string;
  error?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMagicLink("");
    setExpiresAt("");
    setStatus("Creating magic link...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || data.error || (!data.emailSent && (!data.magicLink || !data.expiresAt))) {
        throw new Error(data.error ?? "Could not create magic link.");
      }

      if (data.emailSent) {
        setStatus("Check your email for your DebateLab magic link.");
      } else {
        setMagicLink(data.magicLink ?? "");
        setExpiresAt(data.expiresAt ?? "");
        setStatus("Magic link ready. Open it on this device to log in.");
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create magic link.",
      );
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <section className="section-block register-panel">
        <div className="section-title">
          <p className="eyebrow">Magic link login</p>
          <h2>Email yourself a sign-in link</h2>
        </div>
        <p className="tool-copy">
          In production, DebateLab sends this link by email. If email is not
          configured yet, the free prototype shows the link here so you can test.
        </p>
        <form className="register-form" onSubmit={submitLogin}>
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
          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create magic link"}
          </button>
        </form>
        {magicLink ? (
          <section className="magic-link-card" aria-live="polite">
            <p className="eyebrow">Free prototype link</p>
            <a href={magicLink}>Open magic link</a>
            <small>
              Expires at{" "}
              {new Intl.DateTimeFormat("en", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(expiresAt))}
            </small>
          </section>
        ) : null}
        <a className="inline-link" href="/register">
          Create a profile
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
