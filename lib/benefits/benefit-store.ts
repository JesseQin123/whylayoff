import { randomUUID } from "node:crypto";
import { benefitOffers, type OfferDefinition } from "@/lib/benefits/catalog";

export type BenefitState =
  | "offered" | "assigned" | "opened" | "user_reported_success"
  | "user_reported_failed" | "provider_verified" | "unavailable";
export type BenefitAction = "claim" | "open" | "copy" | "user_reported_success" | "user_reported_failed";

export type BenefitEvent = {
  id: string;
  action: BenefitAction | "provider_verify";
  stateAfter: BenefitState;
  createdAt: string;
};

export type BenefitClaim = {
  id: string;
  ownerTokenHash: string;
  participantId: string;
  sessionId: string;
  offerId: string;
  state: BenefitState;
  assignedCode: string | null;
  providerVerifiedAt: string | null;
  events: BenefitEvent[];
  createdAt: string;
  updatedAt: string;
};

export class BenefitStore {
  private claims = new Map<string, BenefitClaim>();
  private assignedCodes = new Set<string>();

  constructor(private offers: OfferDefinition[] = benefitOffers) {}

  private key(participantId: string, offerId: string) {
    return `${participantId}:${offerId}`;
  }

  record(
    ownerTokenHash: string,
    participantId: string,
    sessionId: string,
    offerId: string,
    action: BenefitAction,
  ) {
    const offer = this.offers.find((item) => item.id === offerId);
    if (!offer) throw new Error("BENEFIT_OFFER_NOT_FOUND");
    const key = this.key(participantId, offerId);
    const timestamp = new Date().toISOString();
    const existing = this.claims.get(key);
    if (!existing && !["claim", "open"].includes(action)) {
      throw new Error("BENEFIT_CLAIM_NOT_FOUND");
    }
    const claim = existing ?? {
      id: randomUUID(),
      ownerTokenHash,
      participantId,
      sessionId,
      offerId,
      state: "offered" as const,
      assignedCode: null,
      providerVerifiedAt: null,
      events: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (action === "claim") {
      if (offer.availability !== "verified_inventory") {
        claim.state = "unavailable";
      } else {
        const code = offer.codes?.find((candidate) => !this.assignedCodes.has(candidate));
        if (!code) claim.state = "unavailable";
        else {
          this.assignedCodes.add(code);
          claim.assignedCode = code;
          claim.state = "assigned";
        }
      }
    } else if (action === "open") {
      if (!offer.url || !["external_resource", "verified_inventory"].includes(offer.availability)) {
        claim.state = "unavailable";
      } else {
        claim.state = "opened";
      }
    } else if (action === "copy") {
      if (!claim.assignedCode) throw new Error("BENEFIT_CODE_NOT_ASSIGNED");
      claim.state = "opened";
    } else if (action === "user_reported_success") {
      claim.state = "user_reported_success";
    } else {
      claim.state = "user_reported_failed";
    }

    claim.updatedAt = timestamp;
    claim.events.push({ id: randomUUID(), action, stateAfter: claim.state, createdAt: timestamp });
    this.claims.set(key, claim);
    return claim;
  }

  providerVerify(participantId: string, offerId: string) {
    const claim = this.claims.get(this.key(participantId, offerId));
    if (!claim) throw new Error("BENEFIT_CLAIM_NOT_FOUND");
    const timestamp = new Date().toISOString();
    claim.state = "provider_verified";
    claim.providerVerifiedAt = timestamp;
    claim.updatedAt = timestamp;
    claim.events.push({ id: randomUUID(), action: "provider_verify", stateAfter: claim.state, createdAt: timestamp });
    return claim;
  }

  listByOwner(ownerTokenHash: string, sessionId: string) {
    return [...this.claims.values()].filter((claim) => claim.ownerTokenHash === ownerTokenHash && claim.sessionId === sessionId);
  }

  deleteForOwner(ownerTokenHash: string) {
    for (const [key, claim] of this.claims) if (claim.ownerTokenHash === ownerTokenHash) this.claims.delete(key);
  }

  dumpOwnerState(ownerTokenHash: string) {
    return structuredClone([...this.claims.values()].filter((claim) => claim.ownerTokenHash === ownerTokenHash));
  }

  restoreOwnerState(ownerTokenHash: string, claims: BenefitClaim[]) {
    this.deleteForOwner(ownerTokenHash);
    for (const claim of claims) {
      const restored = { ...claim, ownerTokenHash };
      this.claims.set(this.key(restored.participantId, restored.offerId), restored);
      if (restored.assignedCode) this.assignedCodes.add(restored.assignedCode);
    }
  }
}

declare global {
  var nextChapterBenefitStore: BenefitStore | undefined;
}

export const benefitStore = globalThis.nextChapterBenefitStore ?? new BenefitStore();
globalThis.nextChapterBenefitStore = benefitStore;
