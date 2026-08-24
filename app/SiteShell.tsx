const navItems = [
  { href: "/videos", label: "Videos" },
  { href: "/debate-bot", label: "Debate with bot" },
  { href: "/debate-friend", label: "Debate with a friend" },
  { href: "/championships", label: "Championships" },
  { href: "/friends", label: "Friends" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#151515]">
      <section className="arena-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">DebateLab</p>
          </div>
        </header>

        <div className="workspace-layout">
          <div className="sidebar-wrap">
            <input
              className="sidebar-checkbox"
              id="sidebar-toggle"
              type="checkbox"
            />
            <label
              className="sidebar-toggle"
              htmlFor="sidebar-toggle"
              aria-label="Open or close sidebar"
            />
            <aside className="sidebar" aria-label="Section navigation">
              <a href="/">
                Home
              </a>
              {navItems.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </aside>
          </div>

          <div className="workspace-main">{children}</div>
        </div>
      </section>
    </main>
  );
}
