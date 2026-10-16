"use client";

import { useState } from "react";

export function ProfileClient({ fullName, email, username, canChangePassword }: { fullName: string; email: string; username: string | null; canChangePassword: boolean }) {
  const [name, setName] = useState(fullName);
  const [handle, setHandle] = useState(username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(action: "name" | "username" | "password") {
    setBusy(true); setError(""); setMessage("");
    const body = action === "name" ? { action, fullName: name } : action === "username" ? { action, username: handle } : { action, currentPassword, newPassword };
    try {
      const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save your changes.");
      setMessage(action === "name" ? "Name updated." : action === "username" ? "Username updated." : "Password updated.");
      if (action === "password") { setCurrentPassword(""); setNewPassword(""); }
      if (action === "username") setHandle(data.username ?? handle);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your changes."); }
    finally { setBusy(false); }
  }

  return <div className="profile-settings">
    <header><h1>Settings</h1><p>Manage your personal details and sign-in.</p></header>
    <section className="settings-section"><div><p className="eyebrow">Profile</p><h2>Public profile</h2></div><label className="debate-field">Email<input value={email} disabled /></label><label className="debate-field">Name<input value={name} disabled={!canChangePassword} onChange={(event) => setName(event.target.value)} /></label>{canChangePassword && <button className="primary-action" disabled={busy || name === fullName} onClick={() => update("name")}>Save name</button>}</section>
    <section className="settings-section"><div><p className="eyebrow">Username</p><h2>Your unique handle</h2></div>{canChangePassword ? <><label className="debate-field"><span>Username</span><div className="username-field"><span aria-hidden="true">@</span><input autoCapitalize="none" autoComplete="username" spellCheck={false} value={handle} onChange={(event) => setHandle(event.target.value)} /></div></label><p className="tool-copy">Used to sign in, invite friends and identify you in DebateLab.</p><button className="primary-action" disabled={busy || handle === username} onClick={() => update("username")}>Save username</button></> : <p className="tool-copy">Your sign-in provider manages your username.</p>}</section>
    <section className="settings-section"><div><p className="eyebrow">Security</p><h2>Password</h2></div>{canChangePassword ? <><label className="debate-field">Current password<input autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label className="debate-field">New password<input autoComplete="new-password" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><button className="primary-action" disabled={busy || !currentPassword || !newPassword} onClick={() => update("password")}>Change password</button></> : <p className="tool-copy">Your sign-in provider manages your account details and password.</p>}</section>
    {message && <p className="voice-status" role="status">{message}</p>}{error && <p className="error-message" role="alert">{error}</p>}
  </div>;
}
