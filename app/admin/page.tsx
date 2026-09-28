import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ResearchWorkspace } from "@/components/research-workspace";

const metrics = [
  ["Interview starts", "—"],
  ["Confirmed resumes", "—"],
  ["Research-approved profiles", "—"],
  ["Useful problem cards", "—"],
] as const;

export default function AdminPage() {
  return (
    <MobileShell className="admin-page">
      <PageIntro eyebrow="Operations preview" title="Pilot health, without mixing permissions">
        <p>Demo shell only. Real records will be filtered by role and current purpose grants.</p>
      </PageIntro>
      <div className="metric-grid">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="eyebrow">Interview queue</p>
            <h2>No participant data yet</h2>
          </div>
          <button className="secondary-button" type="button">Filter records</button>
        </div>
        <p>When the data layer is connected, this view will separate personal-service records, research claims, and follow-up preferences.</p>
      </section>
      <ResearchWorkspace />
    </MobileShell>
  );
}
