import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";

const benefits = [
  {
    name: "Muse invitation codes",
    type: "Community resource",
    body: "Browse community-reported invitation codes. Availability is estimated by the external site and is not guaranteed.",
    status: "Available resource",
  },
  {
    name: "Jobright.ai",
    type: "Potential partner",
    body: "AI job-search support is being evaluated. No coupon, referral benefit, or formal partnership is active yet.",
    status: "Terms pending",
  },
] as const;

export default function BenefitsPage() {
  return (
    <MobileShell className="flow-page">
      <PageIntro eyebrow="Tools and resources" title="Useful options for your next step">
        <p>We label community resources, referral programs, and verified partnerships differently so you know what is actually available.</p>
      </PageIntro>
      <div className="benefit-grid">
        {benefits.map((benefit) => (
          <article className="benefit-card" key={benefit.name}>
            <div className="benefit-card__topline">
              <span>{benefit.type}</span>
              <span className="status-pill">{benefit.status}</span>
            </div>
            <h2>{benefit.name}</h2>
            <p>{benefit.body}</p>
            <button className="secondary-button" type="button">
              {benefit.status === "Terms pending" ? "Notify me if this becomes available" : "View details"}
            </button>
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
