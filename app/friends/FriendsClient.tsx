"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FriendInvitation } from "../lib/friends-store";

export function FriendsClient({ incoming }: { incoming: FriendInvitation[] }) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function request(url: string, body: Record<string, string>) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Something went wrong.");
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("invite"); setError(""); setMessage("");
    try { await request("/api/friends/invite", { login }); setLogin(""); setMessage("Invitation sent."); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send invitation."); }
    finally { setBusy(""); }
  }

  async function accept(invitationId: string) {
    setBusy(invitationId); setError(""); setMessage("");
    try { await request("/api/friends/accept", { invitationId }); setMessage("Friend added."); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not accept invitation."); }
    finally { setBusy(""); }
  }

  return <><section className="friend-add-section"><div><p className="eyebrow">Add a friend</p><h2>Send an invitation</h2></div><form className="friend-invite-form" onSubmit={invite}><label className="sr-only" htmlFor="friend-login">Friend&apos;s login</label><input id="friend-login" value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Friend's login" required /><button className="primary-action" disabled={busy === "invite"}>{busy === "invite" ? "Sending…" : "Send invite"}</button></form></section>{(message || error) && <p className={error ? "error-message" : "success-message"} role="status">{error || message}</p>}{incoming.length > 0 && <section className="friend-invitations"><p className="eyebrow">Invitations</p><h2>Waiting for you</h2><div>{incoming.map((invite) => <article key={invite.id}><div><strong>{invite.displayName}</strong><span>{invite.login ? `@${invite.login}` : "DebateLab member"}</span></div><button className="secondary-action" disabled={busy === invite.id} onClick={() => accept(invite.id)}>{busy === invite.id ? "Accepting…" : "Accept"}</button></article>)}</div></section>}</>;
}
