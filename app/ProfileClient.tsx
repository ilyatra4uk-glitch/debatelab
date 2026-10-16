"use client";

import { useState } from "react";

export function ProfileClient({ fullName, email, canChangePassword }: { fullName: string; email: string; canChangePassword: boolean }) {
  const [name, setName] = useState(fullName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function update(action: "name" | "password") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "name" ? { action, fullName: name } : { action, currentPassword, newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save your changes.");
      setMessage(action === "name" ? "Name updated." : "Password updated.");
      if (action === "password") { setCurrentPassword(""); setNewPassword(""); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your changes."); }
    finally { setBusy(false); }
  }
  return <div className="profile-settings">
    <header><p className="eyebrow">Account</p><h1>Settings</h1><p>Manage your personal details and sign-in.</p></header>
    <section className="settings-section"><div><p className="eyebrow">Profile</p><h2>Personal details</h2></div><label className="debate-field">Email<input value={email} disabled /></label><label className="debate-field">Full name<input value={name} disabled={!canChangePassword} onChange={(event) => setName(event.target.value)} /></label>{canChangePassword && <button className="primary-action" disabled={busy} onClick={() => update("name")}>Save changes</button>}</section>
    <section className="settings-section"><div><p className="eyebrow">Security</p><h2>Password</h2></div>{canChangePassword ? <><label className="debate-field">Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label className="debate-field">New password<input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><button className="primary-action" disabled={busy || !currentPassword || !newPassword} onClick={() => update("password")}>Change password</button></> : <p className="tool-copy">Your sign-in provider manages your account details and password.</p>}</section>
    {message && <p className="voice-status" role="status">{message}</p>}{error && <p className="error-message" role="alert">{error}</p>}
  </div>;
}
