import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-brand brand"><span className="brand-mark" aria-hidden="true">D</span>DebateLab</div>
      <div className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">A little practice. A stronger perspective.</p>
          <h1>Make your <br />next argument <br /><span>your best one.</span></h1>
          <p>Practice with an AI opponent, get specific feedback, and see your progress with every debate.</p>
          <div className="auth-steps"><span>01 <strong>Choose your motion</strong></span><span>02 <strong>Make your case</strong></span><span>03 <strong>Learn from feedback</strong></span></div>
        </section>
        <div className="auth-form-wrap">{children}</div>
      </div>
      <footer className="auth-footer">DebateLab · A space to think, speak, and improve.<Link href="/login">Account access</Link></footer>
    </main>
  );
}
