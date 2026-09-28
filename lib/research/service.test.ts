import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { LocalRepository } from "@/lib/data/local-repository";
import { ResearchStore } from "@/lib/research/research-store";
import { ResearchService } from "@/lib/research/service";

const ownerTokenHash = createHash("sha256").update("research-owner").digest("hex");

function setup() {
  const repository = new LocalRepository();
  const store = new ResearchStore();
  const service = new ResearchService(repository, store);
  const { session } = repository.createSession({
    ownerTokenHash,
    language: "en",
    country: "US",
    source: "conversation",
  });
  return { repository, store, service, session };
}

describe("ResearchService", () => {
  it("does not copy or create research data without a current grant", () => {
    const { service, store, session } = setup();

    expect(() => service.create(ownerTokenHash, session.id, {
      noProblemObserved: false,
      fields: { problemEvent: "A private interview answer" },
    })).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    expect(store.listByOwner(ownerTokenHash, session.id)).toEqual([]);
  });

  it("retains exact source text and keeps an idea unvalidated", () => {
    const { repository, service, session } = setup();
    repository.setPurposeForOwnedSession(ownerTokenHash, session.id, "product_research", true, "research-v1");

    const card = service.create(ownerTokenHash, session.id, {
      noProblemObserved: false,
      fields: {
        firsthandArea: "Warehouse dispatch",
        firsthandObservation: "I saw drivers wait beside the loading door for 40 minutes.",
        participantInference: "A scheduling assistant might reduce the queue.",
      },
    });

    expect(card.validationStatus).toBe("unvalidated_participant_report");
    expect(card.claims).toEqual(expect.arrayContaining([
      expect.objectContaining({
        quote: "I saw drivers wait beside the loading door for 40 minutes.",
        sourceType: "firsthand_observation",
        status: "participant_confirmed",
        independentlyVerified: false,
      }),
      expect.objectContaining({
        quote: "A scheduling assistant might reduce the queue.",
        sourceType: "participant_inference",
        independentlyVerified: false,
      }),
    ]));
  });

  it("accepts no problem observed as a complete research result", () => {
    const { repository, service, session } = setup();
    repository.setPurposeForOwnedSession(ownerTokenHash, session.id, "product_research", true, "research-v1");

    const card = service.create(ownerTokenHash, session.id, { noProblemObserved: true, fields: {} });

    expect(card.noProblemObserved).toBe(true);
    expect(card.claims).toEqual([expect.objectContaining({ status: "no_problem_observed" })]);
  });

  it("records corrections and stops reads after permission is revoked", () => {
    const { repository, service, session } = setup();
    const grant = repository.setPurposeForOwnedSession(ownerTokenHash, session.id, "product_research", true, "research-v1");
    const card = service.create(ownerTokenHash, session.id, {
      noProblemObserved: false,
      fields: { firsthandArea: "Claims", problemEvent: "The first description" },
    });

    const corrected = service.update(ownerTokenHash, session.id, card.id, {
      noProblemObserved: false,
      fields: { firsthandArea: "Claims", problemEvent: "The corrected description" },
    });
    expect(corrected).toMatchObject({ version: 2, revisionHistory: [{ version: 1 }] });
    expect(corrected.claims).toEqual(expect.arrayContaining([
      expect.objectContaining({ quote: "The corrected description" }),
    ]));

    repository.revokeGrant(ownerTokenHash, grant.id);
    expect(() => service.list(ownerTokenHash, session.id)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });
});
