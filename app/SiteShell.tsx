"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/debate-bot", label: "Practice" },
  { href: "/videos", label: "Lessons" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
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
          <Link className="brand" href="/" aria-label="DebateLab home"><span className="brand-mark" aria-hidden="true">D</span>DebateLab</Link>
          <nav className="top-nav" aria-label="Main navigation">
            {navItems.map((item) => <Link aria-current={pathname === item.href ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <button className="signout-button" disabled={isLeaving} onClick={signOut}>{isLeaving ? "Signing out…" : "Sign out"}</button>
        </div>
      </header>
      <main className="app-content" id="main-content">
        {error && <p className="error-message" role="alert">{error}</p>}
        {children}
      </main>
    </div>
  );
}
