import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { BenefitsCatalog } from "@/components/benefits-catalog";
import { FollowUpPreferences } from "@/components/follow-up-preferences";

export default function BenefitsPage() {
  return (
    <MobileShell className="flow-page">
      <PageIntro eyebrow="Tools and resources" title="Useful options for your next step">
        <p>Independent resources, pending partner discussions, and verified offers are labeled separately. Opening a link or copying a code never counts as a confirmed redemption.</p>
      </PageIntro>
      <BenefitsCatalog />
      <FollowUpPreferences />
    </MobileShell>
  );
}
