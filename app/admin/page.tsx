import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ResearchWorkspace } from "@/components/research-workspace";
import { OperationsFilters } from "@/components/operations-filters";
import { ObservabilityPanel } from "@/components/observability-panel";

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
            <p className="eyebrow">Access model</p>
            <h2>Local owner-scoped preview</h2>
          </div>
        </div>
        <p>This MVP shows only the current browser owner. Production staff access requires a verified role; research claims and follow-up preferences remain filtered by their current grants.</p>
      </section>
      <ResearchWorkspace />
      <OperationsFilters />
      <ObservabilityPanel />
    </MobileShell>
  );
}
