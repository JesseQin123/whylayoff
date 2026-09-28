import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { LocalRepository } from "@/lib/data/local-repository";

const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");

function createOwnedSession(repository: LocalRepository, token = "owner-a") {
  return repository.createSession({
    ownerTokenHash: tokenHash(token),
    language: "en",
    country: "US",
    source: "conversation",
  });
}

describe("LocalRepository", () => {
  it("isolates sessions between owners", () => {
    const repository = new LocalRepository();
    const { session } = createOwnedSession(repository, "owner-a");
    createOwnedSession(repository, "owner-b");

    expect(() => repository.getOwnedSession(tokenHash("owner-b"), session.id)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("keeps personal service active when research is declined", () => {
    const repository = new LocalRepository();
    const { participant, session } = createOwnedSession(repository);

    repository.setPurposeForOwnedSession(
      tokenHash("owner-a"),
      session.id,
      "product_research",
      false,
      "research-v1",
    );

    expect(repository.canProcess(participant.id, "personal_service")).toBe(true);
    expect(repository.canProcess(participant.id, "product_research")).toBe(false);
  });

  it("stops new processing after a purpose is revoked", () => {
    const repository = new LocalRepository();
    const { participant, session } = createOwnedSession(repository);
    const grant = repository.setPurposeForOwnedSession(
      tokenHash("owner-a"),
      session.id,
      "product_research",
      true,
      "research-v1",
    );

    repository.revokeGrant(tokenHash("owner-a"), grant.id);

    expect(repository.canProcess(participant.id, "product_research")).toBe(false);
  });

  it("keeps each follow-up preference independent", () => {
    const repository = new LocalRepository();
    const { participant, session } = createOwnedSession(repository);

    repository.setContactPreferences(tokenHash("owner-a"), session.id, {
      emailAddress: "expert@example.com",
      serviceEmail: false,
      courseInformation: true,
      community: false,
      expertFollowUp: true,
      noticeVersion: "contact-v1",
    });

    expect(repository.canProcess(participant.id, "course_information")).toBe(true);
    expect(repository.canProcess(participant.id, "community")).toBe(false);
    expect(repository.canProcess(participant.id, "expert_follow_up")).toBe(true);
  });

  it("uses the latest opt-out state in operations profiles and exports", () => {
    const repository = new LocalRepository();
    const { participant, session } = createOwnedSession(repository);
    repository.setContactPreferences(tokenHash("owner-a"), session.id, {
      emailAddress: "person@example.com",
      serviceEmail: true,
      courseInformation: true,
      community: true,
      expertFollowUp: false,
      noticeVersion: "contact-v1",
    });
    repository.setContactPreferences(tokenHash("owner-a"), session.id, {
      emailAddress: "person@example.com",
      serviceEmail: false,
      courseInformation: false,
      community: false,
      expertFollowUp: false,
      noticeVersion: "contact-v1",
    });

    expect(repository.canProcess(participant.id, "course_information")).toBe(false);
    expect(repository.getOwnedOperationsProfile(tokenHash("owner-a"), session.id).contactPreferences).toMatchObject({
      courseInformation: false,
      community: false,
      version: 2,
    });
    expect(repository.exportParticipantData(tokenHash("owner-a"), session.id).contactPreferences).toMatchObject({
      courseInformation: false,
      community: false,
      version: 2,
    });
  });

  it("deduplicates answers and advances state only once", () => {
    const repository = new LocalRepository();
    const { session } = createOwnedSession(repository);
    const answer = {
      clientMessageId: "client-message-0001",
      expectedStateVersion: 0,
      text: "I want a role where I can improve operations.",
      facts: [{ field: "career_goal", value: "Improve operations", status: "confirmed" as const }],
    };

    const first = repository.submitAnswer(tokenHash("owner-a"), session.id, answer);
    const duplicate = repository.submitAnswer(tokenHash("owner-a"), session.id, answer);

    expect(first.stateVersion).toBe(1);
    expect(duplicate).toMatchObject({ messageId: first.messageId, stateVersion: 1, duplicate: true });
    expect(repository.getSessionSnapshot(tokenHash("owner-a"), session.id).facts).toHaveLength(1);
  });

  it("marks competing confirmed values as contradicted", () => {
    const repository = new LocalRepository();
    const { session } = createOwnedSession(repository);
    repository.submitAnswer(tokenHash("owner-a"), session.id, {
      clientMessageId: "client-message-0001",
      expectedStateVersion: 0,
      text: "I worked in logistics.",
      facts: [{ field: "industry", value: "logistics", status: "confirmed" }],
    });

    repository.submitAnswer(tokenHash("owner-a"), session.id, {
      clientMessageId: "client-message-0002",
      expectedStateVersion: 1,
      text: "Correction: it was manufacturing.",
      facts: [{ field: "industry", value: "manufacturing", status: "confirmed" }],
    });

    expect(repository.getSessionSnapshot(tokenHash("owner-a"), session.id).facts[0]).toMatchObject({
      field: "industry",
      status: "contradicted",
      revision: 2,
    });
  });

  it("revokes access and removes messages and facts on deletion", () => {
    const repository = new LocalRepository();
    const { session } = createOwnedSession(repository);
    repository.submitAnswer(tokenHash("owner-a"), session.id, {
      clientMessageId: "client-message-0001",
      expectedStateVersion: 0,
      text: "I know claims operations.",
      facts: [{ field: "domain", value: "claims operations", status: "confirmed" }],
    });

    expect(repository.deleteParticipantData(tokenHash("owner-a"), session.id).status).toBe("completed");
    expect(() => repository.getOwnedSession(tokenHash("owner-a"), session.id)).toThrowError(
      expect.objectContaining({ code: "DELETED" }),
    );
  });
});
