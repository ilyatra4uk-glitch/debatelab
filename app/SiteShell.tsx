"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/compete", label: "Compete" },
  { href: "/videos", label: "Learn" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  async function signOut() {
    setIsLeaving(true);
    setError("");
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      const data = await response.json() as { redirectTo?: string };
      window.location.href = data.redirectTo || "/login";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign out.");
      setIsLeaving(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="DebateLab home"><img className="brand-mark" src="/favicon.svg" alt="" />DebateLab</Link>
          <nav className="top-nav" aria-label="Main navigation">
            {navItems.map((item) => <Link aria-current={(pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))) ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <div className="account-menu">
            <button className="account-button" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen((open) => !open)}><span className="account-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-3.6 3-5.5 6.5-5.5s5.8 1.9 6.5 5.5"/></svg></span>Account</button>
            {accountOpen && <div className="account-popover" role="menu"><Link href="/profile" role="menuitem" onClick={() => setAccountOpen(false)}>Settings</Link><button role="menuitem" disabled={isLeaving} onClick={signOut}>{isLeaving ? "Logging out…" : "Log out"}</button></div>}
          </div>
        </div>
      </header>
      <main className="app-content" id="main-content">
        {error && <p className="error-message" role="alert">{error}</p>}
        {children}
      </main>
    </div>
  );
}
