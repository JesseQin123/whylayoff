import { MobileShell } from "@/components/mobile-shell";
import { PageIntro } from "@/components/page-intro";
import { ResumeEditor } from "@/components/resume-editor";

export default function ResumePage() {
  return (
    <MobileShell className="document-page">
      <PageIntro eyebrow="Resume draft" title="A focused version you can make your own">
        <p>Every starting statement comes from information you confirmed. Edit the wording, fill the missing facts, then confirm before final export.</p>
      </PageIntro>
      <ResumeEditor />
    </MobileShell>
  );
}
