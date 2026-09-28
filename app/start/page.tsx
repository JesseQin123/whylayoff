import Link from "next/link";
import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ProgressSteps } from "@/components/progress-steps";

export default function StartPage() {
  return (
    <MobileShell className="flow-page">
      <ProgressSteps current={0} />
      <PageIntro eyebrow="Step 1 of 3" title="How would you like to begin?">
        <p>Choose the easiest way to tell us about your work. You can change or add details later.</p>
      </PageIntro>
      <div className="choice-stack">
        <Link className="choice-card choice-card--featured" href="/interview">
          <span className="choice-card__icon" aria-hidden="true">●</span>
          <span>
            <strong>Tell me about your work</strong>
            <small>Speak or type one answer at a time</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="choice-card" href="/interview?source=resume">
          <span className="choice-card__icon" aria-hidden="true">↥</span>
          <span>
            <strong>Use an existing resume</strong>
            <small>Upload a PDF or DOCX, then confirm the details</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="choice-card" href="/interview?source=linkedin">
          <span className="choice-card__icon" aria-hidden="true">in</span>
          <span>
            <strong>Add a LinkedIn link</strong>
            <small>We save the link for context; we do not fetch it in this version</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <p className="helper-text">No resume or LinkedIn profile is required.</p>
    </MobileShell>
  );
}
