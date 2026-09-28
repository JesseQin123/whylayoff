import { BackgroundIntake } from "@/components/background-intake";
import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ProgressSteps } from "@/components/progress-steps";

export default async function BackgroundPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source = "conversation" } = await searchParams;
  return (
    <MobileShell className="flow-page">
      <ProgressSteps current={0} />
      <PageIntro eyebrow="Your starting point" title="Tell us what you know best.">
        <p>Add as much or as little as you want. You will review every extracted detail before it becomes part of your profile.</p>
      </PageIntro>
      <BackgroundIntake initialSource={source} />
    </MobileShell>
  );
}
