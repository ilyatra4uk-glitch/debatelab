import { SiteShell } from "../SiteShell";
import { competitions } from "../data";

export default function ChampionshipsPage() {
  return (
    <SiteShell>
      <section className="section-block championships-panel">
        <div className="section-title">
          <p className="eyebrow">Compete</p>
          <h2>Available championships</h2>
        </div>
        <article className="featured-championship">
          <p className="eyebrow">Available now</p>
          <h3>{competitions[0].title}</h3>
          <p>{competitions[0].format} - {competitions[0].prize}</p>
          <button type="button">Enter</button>
        </article>
        <div className="competition-list">
          {competitions.map((competition) => (
            <article className="competition-card" key={competition.title}>
              <span>{competition.status}</span>
              <h3>{competition.title}</h3>
              <p>{competition.format}</p>
              <strong>{competition.prize}</strong>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
