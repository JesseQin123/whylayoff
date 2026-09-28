import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BenefitStore } from "@/lib/benefits/benefit-store";
import { BenefitsService } from "@/lib/benefits/service";
import type { OfferDefinition } from "@/lib/benefits/catalog";
import { LocalRepository } from "@/lib/data/local-repository";

const ownerTokenHash = createHash("sha256").update("benefit-owner").digest("hex");
const activeOffer: OfferDefinition = {
  id: "verified-test-offer",
  partnerId: "test-partner",
  title: "Test benefit",
  availability: "verified_inventory",
  description: "Test",
  termsSummary: "Test terms",
  eligibility: "Test eligibility",
  url: "https://example.com/redeem",
  codes: ["CODE-ONE"],
};

function setup(offers: OfferDefinition[] = [activeOffer]) {
  const repository = new LocalRepository();
  const store = new BenefitStore(offers);
  const service = new BenefitsService(repository, store);
  const { session } = repository.createSession({ ownerTokenHash, language: "en", country: "US", source: "conversation" });
  return { repository, store, service, session };
}

describe("benefit lifecycle", () => {
  it("does not count assignment, opening, or copying as provider redemption", () => {
    const { service, session } = setup();
    expect(service.record(ownerTokenHash, session.id, activeOffer.id, "claim")).toMatchObject({
      state: "assigned",
      assignedCode: "CODE-ONE",
      providerVerifiedAt: null,
    });
    expect(service.record(ownerTokenHash, session.id, activeOffer.id, "copy")).toMatchObject({
      state: "opened",
      providerVerifiedAt: null,
    });
    expect(service.record(ownerTokenHash, session.id, activeOffer.id, "open")).toMatchObject({
      state: "opened",
      providerVerifiedAt: null,
    });
  });

  it("keeps participant success separate from provider verification", () => {
    const { service, store, session, repository } = setup();
    service.record(ownerTokenHash, session.id, activeOffer.id, "open");
    const reported = service.record(ownerTokenHash, session.id, activeOffer.id, "user_reported_success");
    expect(reported).toMatchObject({ state: "user_reported_success", providerVerifiedAt: null });

    const participant = repository.findParticipantByToken(ownerTokenHash)!;
    expect(store.providerVerify(participant.id, activeOffer.id)).toMatchObject({
      state: "provider_verified",
      providerVerifiedAt: expect.any(String),
    });
  });

  it("allows benefits without marketing or research permission", () => {
    const { repository, service, session } = setup();
    const participant = repository.findParticipantByToken(ownerTokenHash)!;
    expect(repository.canProcess(participant.id, "product_research")).toBe(false);
    expect(repository.canProcess(participant.id, "course_information")).toBe(false);
    expect(service.record(ownerTokenHash, session.id, activeOffer.id, "open").state).toBe("opened");
  });
});
