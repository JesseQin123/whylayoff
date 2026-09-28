import { InterviewExperience } from "@/components/interview-experience";
import { MobileShell } from "@/components/mobile-shell";
import { ProgressSteps } from "@/components/progress-steps";

export default function InterviewPage() {
  return (
    <MobileShell className="flow-page flow-page--interview">
      <ProgressSteps current={1} />
      <InterviewExperience />
      <p className="privacy-note">Your microphone only starts after you choose “Start speaking.” You review the transcript before it is sent.</p>
    </MobileShell>
  );
}
