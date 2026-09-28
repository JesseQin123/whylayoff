import type { BackgroundStore } from "@/lib/background/background-store";
import { publicBackgroundAsset } from "@/lib/background/extract";
import type { BenefitStore } from "@/lib/benefits/benefit-store";
import { publicBenefitClaim } from "@/lib/benefits/service";
import type { LocalRepository } from "@/lib/data/local-repository";
import type { ResumeStore } from "@/lib/outputs/resume-store";
import type { ResearchStore } from "@/lib/research/research-store";
import { publicProblemCard } from "@/lib/research/service";

export class PrivacyService {
  constructor(
    private repository: LocalRepository,
    private backgroundStore: BackgroundStore,
    private resumeStore: ResumeStore,
    private researchStore: ResearchStore,
    private benefitStore: BenefitStore,
  ) {}

  exportData(ownerTokenHash: string, sessionId: string) {
    const core = this.repository.exportParticipantData(ownerTokenHash, sessionId);
    return {
      ...core,
      backgroundAssets: this.backgroundStore.list(ownerTokenHash, sessionId).map(publicBackgroundAsset),
      currentResume: this.resumeStore.current(ownerTokenHash, sessionId),
      researchProblemCards: this.researchStore.listByOwner(ownerTokenHash, sessionId).map(publicProblemCard),
      benefitActivity: this.benefitStore.listByOwner(ownerTokenHash, sessionId).map(publicBenefitClaim),
    };
  }

  deleteData(ownerTokenHash: string, sessionId: string) {
    const result = this.repository.deleteParticipantData(ownerTokenHash, sessionId);
    this.backgroundStore.deleteForOwner(ownerTokenHash);
    this.resumeStore.deleteForOwner(ownerTokenHash);
    this.researchStore.deleteForOwner(ownerTokenHash);
    this.benefitStore.deleteForOwner(ownerTokenHash);
    return result;
  }
}
