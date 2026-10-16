"use client";

import { useState } from "react";
import { AuthShell } from "../AuthShell";

type LoginResponse = { error?: string };

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) });
      const data = (await response.json()) as LoginResponse;
      if (!response.ok || data.error) throw new Error(data.error ?? "Could not log in.");
      window.location.href = "/";
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not log in."); }
    finally { setIsSubmitting(false); }
  }
  return <AuthShell><section className="section-block register-panel"><div className="section-title"><p className="eyebrow">Welcome back</p><h2>Log in to DebateLab</h2></div><form className="register-form" onSubmit={submitLogin}><label className="debate-field"><span>Username</span><input autoCapitalize="none" autoComplete="username" name="username" onChange={(event) => setLogin(event.target.value)} required value={login} /></label><label className="debate-field"><span>Password</span><input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? "Logging in..." : "Log in"}</button></form><a className="inline-link" href="/register">Create a profile</a>{error ? <p className="error-message" aria-live="assertive">{error}</p> : null}</section></AuthShell>;
}
