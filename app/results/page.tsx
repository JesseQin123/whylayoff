import Link from "next/link";
import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ProgressSteps } from "@/components/progress-steps";
import { resultCards } from "@/lib/content";
import { FactCorrection } from "@/components/fact-correction";
import { CareerResults } from "@/components/career-results";

export default function ResultsPage() {
  return (
    <MobileShell className="flow-page">
      <ProgressSteps current={2} />
      <PageIntro eyebrow="Your working draft" title="Here is what your experience points to.">
        <p>Everything here should come from information you provided. Review and correct it before using your resume.</p>
      </PageIntro>
      <CareerResults />
      <div className="result-grid">
        {resultCards.map((card, index) => (
          <article className="result-card" key={card.title}>
            <span className="result-card__number">0{index + 1}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <Link href={card.href}>{card.action} <span aria-hidden="true">→</span></Link>
          </article>
        ))}
      </div>
      <FactCorrection />
      <section className="research-invite">
        <div>
          <p className="eyebrow">Optional</p>
          <h2>Help us understand a problem in your industry</h2>
        </div>
        <p>Your personal result does not depend on joining product research. You choose how these answers may be used.</p>
        <button className="secondary-button" type="button">Review research choice</button>
      </section>
    </MobileShell>
  );
}
