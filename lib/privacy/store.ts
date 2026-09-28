import { backgroundStore } from "@/lib/background/background-store";
import { benefitStore } from "@/lib/benefits/benefit-store";
import { repository } from "@/lib/data/store";
import { resumeStore } from "@/lib/outputs/resume-store";
import { PrivacyService } from "@/lib/privacy/privacy-service";
import { researchStore } from "@/lib/research/research-store";
import { operationStore } from "@/lib/observability/operation-store";
import { transcriptionStore } from "@/lib/audio/transcription-store";

export const privacyService = new PrivacyService(
  repository,
  backgroundStore,
  resumeStore,
  researchStore,
  benefitStore,
  operationStore,
  transcriptionStore,
);
