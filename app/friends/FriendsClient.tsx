"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FriendInvitation, FriendStats } from "../lib/friends-store";

type FriendsClientProps = { friends: FriendStats[]; incoming: FriendInvitation[] };

export function FriendsClient({ friends, incoming }: FriendsClientProps) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<FriendStats | null>(null);

  async function request(url: string, body: Record<string, string>) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Something went wrong.");
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("invite"); setError(""); setMessage("");
    try { await request("/api/friends/invite", { login }); setLogin(""); setInviteOpen(false); setMessage("Invitation sent."); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send invitation."); }
    finally { setBusy(""); }
  }

  async function accept(invitationId: string) {
    setBusy(invitationId); setError(""); setMessage("");
    try { await request("/api/friends/accept", { invitationId }); setMessage("Friend added."); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not accept invitation."); }
    finally { setBusy(""); }
  }

  async function remove() {
    if (!friendToRemove) return;
    setBusy("remove"); setError(""); setMessage("");
    try { await request("/api/friends/remove", { friendId: friendToRemove.userId }); setFriendToRemove(null); setMessage("Friend removed."); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove friend."); }
    finally { setBusy(""); }
  }

  return <>
    <div className="friend-toolbar">
      <button className="secondary-action friend-add-button" onClick={() => { setError(""); setMessage(""); setInviteOpen(true); }}>Add friend</button>
    </div>
    {(message || error) && <p className={error ? "error-message" : "success-message"} role="status">{error || message}</p>}
    {incoming.length > 0 && <section className="friend-invitations">
      <div className="section-heading"><h2>Friend requests</h2></div>
      <div>{incoming.map((invite) => <article key={invite.id}>
        <div className="friend-request-person">
          <div className="friend-avatar" aria-hidden="true">{invite.displayName.slice(0, 1).toUpperCase()}</div>
          <div><strong>{invite.displayName}</strong><span>{invite.login ? `@${invite.login}` : "DebateLab member"}</span></div>
        </div>
        <button className="secondary-action" disabled={busy === invite.id} onClick={() => accept(invite.id)}>{busy === invite.id ? "Accepting…" : "Accept"}</button>
      </article>)}</div>
    </section>}
    <section className="friends-section">
      <div className="section-heading"><h2>Friends</h2></div>
      {friends.length ? <div className="friend-grid">{friends.map((friend) => <article className="friend-card" key={friend.userId}>
        <div className="friend-card-heading">
          <div className="friend-avatar" aria-hidden="true">{friend.displayName.slice(0, 1).toUpperCase()}</div>
          <div><h3>{friend.displayName}</h3><span>{friend.login ? `@${friend.login}` : "DebateLab member"}</span></div>
          <button className="friend-more-button" aria-label={`Remove ${friend.displayName}`} title="Remove friend" onClick={() => setFriendToRemove(friend)}>•••</button>
        </div>
        <div className="friend-stat-grid"><div><strong>{friend.practiceCount}</strong><span>practices</span></div><div><strong>{friend.currentStreak}</strong><span>day streak</span></div></div>
      </article>)}</div> : <p className="friends-empty">Add people to your circle and keep each other practising.</p>}
    </section>
    {isInviteOpen && <div className="dialog-backdrop" onMouseDown={() => setInviteOpen(false)}>
      <section className="friend-dialog" role="dialog" aria-modal="true" aria-labelledby="add-friend-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" aria-label="Close" onClick={() => setInviteOpen(false)}>×</button>
        <h2 id="add-friend-title">Add a friend</h2>
        <p>Enter their DebateLab login to send an invitation.</p>
        <form className="friend-dialog-form" onSubmit={invite}>
          <label htmlFor="friend-login">Login</label>
          <input id="friend-login" name="friend-login" type="search" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={login} onChange={(event) => setLogin(event.target.value)} placeholder="e.g. ava-murphy" required autoFocus />
          <button className="primary-action" disabled={busy === "invite"}>{busy === "invite" ? "Sending…" : "Send invitation"}</button>
        </form>
      </section>
    </div>}
    {friendToRemove && <div className="dialog-backdrop" onMouseDown={() => setFriendToRemove(null)}>
      <section className="friend-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-friend-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" aria-label="Close" onClick={() => setFriendToRemove(null)}>×</button>
        <h2 id="remove-friend-title">Remove {friendToRemove.displayName}?</h2>
        <p>You will no longer see each other in Friends or on your shared ranking.</p>
        <div className="friend-dialog-actions"><button className="secondary-action" onClick={() => setFriendToRemove(null)}>Cancel</button><button className="danger-action" disabled={busy === "remove"} onClick={remove}>{busy === "remove" ? "Removing…" : "Remove friend"}</button></div>
      </section>
    </div>}
  </>;
}
