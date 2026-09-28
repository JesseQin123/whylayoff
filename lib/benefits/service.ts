import { DataAccessError, type LocalRepository } from "@/lib/data/local-repository";
import { type BenefitAction, type BenefitStore } from "@/lib/benefits/benefit-store";

export class BenefitsService {
  constructor(private repository: LocalRepository, private store: BenefitStore) {}

  record(ownerTokenHash: string, sessionId: string, offerId: string, action: BenefitAction) {
    const session = this.repository.getOwnedSession(ownerTokenHash, sessionId);
    try {
      return this.store.record(ownerTokenHash, session.participantId, session.id, offerId, action);
    } catch (error) {
      if (error instanceof Error && error.message === "BENEFIT_OFFER_NOT_FOUND") {
        throw new DataAccessError("Benefit offer not found", "NOT_FOUND");
      }
      if (error instanceof Error && error.message === "BENEFIT_CODE_NOT_ASSIGNED") {
        throw new DataAccessError("No assigned code is available to copy", "CONFLICT");
      }
      if (error instanceof Error && error.message === "BENEFIT_CLAIM_NOT_FOUND") {
        throw new DataAccessError("Open or claim the benefit before reporting a result", "CONFLICT");
      }
      throw error;
    }
  }

  list(ownerTokenHash: string, sessionId: string) {
    this.repository.getOwnedSession(ownerTokenHash, sessionId);
    return this.store.listByOwner(ownerTokenHash, sessionId);
  }
}

export function publicBenefitClaim(claim: ReturnType<BenefitStore["record"]>) {
  return {
    id: claim.id,
    offerId: claim.offerId,
    state: claim.state,
    assignedCode: claim.assignedCode,
    providerVerifiedAt: claim.providerVerifiedAt,
    events: claim.events,
    updatedAt: claim.updatedAt,
  };
}
