"use client";

import { useState } from "react";
import { AuthShell } from "../AuthShell";

type RegisterResponse = { error?: string };

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, login, password }) });
      const data = (await response.json()) as RegisterResponse;
      if (!response.ok || data.error) throw new Error(data.error ?? "Could not create profile.");
      window.location.href = "/debate-bot";
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create profile."); }
    finally { setIsSubmitting(false); }
  }
  return <AuthShell><section className="section-block register-panel"><div className="section-title"><p className="eyebrow">Join DebateLab</p><h2>Create your speaker profile</h2></div><form className="register-form" onSubmit={submitRegistration}><label className="debate-field"><span>Name</span><input autoComplete="name" name="displayName" onChange={(event) => setDisplayName(event.target.value)} placeholder="Ilya K." required value={displayName} /></label><label className="debate-field"><span>Login</span><input autoComplete="username" name="login" onChange={(event) => setLogin(event.target.value)} placeholder="ilya.trachuk" required value={login} /></label><label className="debate-field"><span>Password</span><input autoComplete="new-password" name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><p className="tool-copy">Use 3–32 letters, numbers, dots, dashes, or underscores for your login. Password: at least 8 characters.</p><button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating..." : "Create profile"}</button></form><a className="inline-link" href="/login">Already have a profile? Log in</a>{error ? <p className="error-message" aria-live="assertive">{error}</p> : null}</section></AuthShell>;
}
