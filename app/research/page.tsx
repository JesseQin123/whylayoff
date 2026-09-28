import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ResearchProblemForm } from "@/components/research-problem-form";

export default function ResearchPage() {
  return (
    <MobileShell className="flow-page research-page">
      <PageIntro eyebrow="Optional research" title="Share one problem you know firsthand">
        <p>Your career tools work without this. If you opt in, you control and review every statement before it joins the research workspace.</p>
      </PageIntro>
      <ResearchProblemForm />
    </MobileShell>
  );
}
