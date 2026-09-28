import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { PrivacyControls } from "@/components/privacy-controls";

export default function PrivacyPage() {
  return (
    <MobileShell className="flow-page">
      <PageIntro eyebrow="Your data" title="You control what is saved and shared.">
        <p>Download the information tied to this session or delete it. Optional research sharing can be changed in the interview.</p>
      </PageIntro>
      <PrivacyControls />
    </MobileShell>
  );
}
