"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/videos", label: "Videos" },
  { href: "/debate-bot", label: "Debate with bot" },
  { href: "/debate-friend", label: "Debate with a friend" },
  { href: "/championships", label: "Championships" },
  { href: "/friends", label: "Friends" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isActive = (href: string) => pathname === href;

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#151515]">
      <section className="arena-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">DebateLab</p>
          </div>
        </header>

        <div className="workspace-layout">
          <div className={sidebarOpen ? "sidebar-wrap" : "sidebar-wrap closed"}>
            <button
              className="sidebar-toggle"
              type="button"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? "<" : ">"}
            </button>
            <aside className="sidebar" aria-label="Section navigation">
              <Link aria-current={isActive("/") ? "page" : undefined} href="/">
                Home
              </Link>
              {navItems.map((item) => (
                <Link
                  aria-current={isActive(item.href) ? "page" : undefined}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </aside>
          </div>

          <div className="workspace-main">{children}</div>
        </div>
      </section>
    </main>
  );
}
