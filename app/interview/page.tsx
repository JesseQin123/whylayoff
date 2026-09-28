import Link from "next/link";
import { MobileShell } from "@/components/mobile-shell";
import { ProgressSteps } from "@/components/progress-steps";

export default function InterviewPage() {
  return (
    <MobileShell className="flow-page flow-page--interview">
      <ProgressSteps current={1} />
      <section className="interview-card" aria-labelledby="current-question">
        <div className="interview-card__meta">
          <span>Question 1</span>
          <button className="text-button" type="button">Save for later</button>
        </div>
        <p className="eyebrow">Let&apos;s start with your goal</p>
        <h1 id="current-question">What would you most like to change about your work situation?</h1>
        <p className="question-help">A short answer is enough. You can talk about the kind of role, schedule, or direction you want.</p>
        <label className="answer-field">
          <span className="sr-only">Your answer</span>
          <textarea rows={6} placeholder="Type your answer here…" />
        </label>
        <div className="voice-row">
          <button className="voice-button" type="button">
            <span aria-hidden="true">●</span>
            Start speaking
          </button>
          <button className="secondary-button" type="button">Listen to question</button>
        </div>
        <div className="interview-card__actions">
          <button className="text-button" type="button">Skip this question</button>
          <Link className="button button--primary" href="/results">Continue</Link>
        </div>
      </section>
      <p className="privacy-note">Your microphone only starts after you choose “Start speaking.” You review the transcript before it is sent.</p>
    </MobileShell>
  );
}
