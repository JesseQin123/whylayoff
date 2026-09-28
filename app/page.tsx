import Link from "next/link";
import { MobileShell } from "@/components/mobile-shell";
import { valueCards } from "@/lib/content";

export default function HomePage() {
  return (
    <MobileShell className="home-page">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Your experience still matters</p>
          <h1>Turn what you know into a stronger next step.</h1>
          <p className="hero__lead">
            Talk through the work you know best. Leave with a clearer skills story,
            an editable resume, and useful job-search resources.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/start">
              Build my next step
            </Link>
            <span className="hero__time">About 10–15 minutes if you already have a resume</span>
          </div>
        </div>
        <aside className="hero-card" aria-label="What you receive">
          <span className="hero-card__kicker">Your result</span>
          <h2>A practical career pack</h2>
          <ul className="check-list">
            <li>Skills backed by your examples</li>
            <li>A resume you can edit and download</li>
            <li>Role ideas and relevant tools</li>
          </ul>
        </aside>
      </section>

      <section className="section" aria-labelledby="how-it-helps">
        <div className="section-heading">
          <p className="eyebrow">Built around your real work</p>
          <h2 id="how-it-helps">Useful from the first conversation</h2>
        </div>
        <div className="value-grid">
          {valueCards.map((card) => (
            <article className="value-card" key={card.title}>
              <p className="eyebrow">{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-panel">
        <div>
          <p className="eyebrow">You stay in control</p>
          <h2>Your answers can help you without becoming research data.</h2>
        </div>
        <p>
          Using your experience for Solo Unicorn product research is a separate choice.
          You can skip questions, correct the summary, or delete your session.
        </p>
      </section>
    </MobileShell>
  );
}
