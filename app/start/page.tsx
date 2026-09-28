import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ProgressSteps } from "@/components/progress-steps";
import { StartOptions } from "@/components/start-options";

export default function StartPage() {
  return (
    <MobileShell className="flow-page">
      <ProgressSteps current={0} />
      <PageIntro eyebrow="Step 1 of 3" title="How would you like to begin?">
        <p>Choose the easiest way to tell us about your work. You can change or add details later.</p>
      </PageIntro>
      <StartOptions />
      <p className="helper-text">No resume or LinkedIn profile is required.</p>
    </MobileShell>
  );
}
