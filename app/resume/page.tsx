import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";

export default function ResumePage() {
  return (
    <MobileShell className="document-page">
      <PageIntro eyebrow="Resume draft" title="A focused version you can make your own">
        <p>This sample shows the editor structure. Unconfirmed facts stay visible as questions, not invented content.</p>
      </PageIntro>
      <div className="document-layout">
        <section className="resume-preview" aria-label="Resume preview">
          <div className="resume-preview__header">
            <div>
              <h2>Your Name</h2>
              <p>Operations &amp; logistics professional</p>
            </div>
            <span className="status-pill">Draft</span>
          </div>
          <h3>Professional summary</h3>
          <p>Experienced operations professional skilled in resolving exceptions, coordinating across teams, and keeping work moving through clear follow-up.</p>
          <h3>Selected experience</h3>
          <div className="resume-item">
            <strong>Most recent role</strong>
            <span>Company and dates need your confirmation</span>
            <ul>
              <li>Coordinated missing-document exceptions from initial flag through billing handoff.</li>
              <li>Used operational judgment to distinguish documentation gaps from delivery issues.</li>
            </ul>
          </div>
        </section>
        <aside className="document-tools">
          <h2>Before you export</h2>
          <ul className="review-list">
            <li><span className="review-list__pending">!</span> Confirm employer and dates</li>
            <li><span className="review-list__done">✓</span> Review skills language</li>
            <li><span className="review-list__done">✓</span> Choose target direction</li>
          </ul>
          <button className="button button--primary" type="button">Edit resume</button>
          <button className="secondary-button" type="button">Copy plain text</button>
        </aside>
      </div>
    </MobileShell>
  );
}
