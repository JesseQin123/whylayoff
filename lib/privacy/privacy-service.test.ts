import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BackgroundStore } from "@/lib/background/background-store";
import { BenefitStore } from "@/lib/benefits/benefit-store";
import { BenefitsService } from "@/lib/benefits/service";
import { LocalRepository } from "@/lib/data/local-repository";
import { ResumeStore } from "@/lib/outputs/resume-store";
import { PrivacyService } from "@/lib/privacy/privacy-service";
import { ResearchStore } from "@/lib/research/research-store";
import { ResearchService } from "@/lib/research/service";

const ownerTokenHash = createHash("sha256").update("privacy-owner").digest("hex");

describe("PrivacyService", () => {
  it("exports every local data class and deletes it across stores", () => {
    const repository = new LocalRepository();
    const backgrounds = new BackgroundStore();
    const resumes = new ResumeStore();
    const research = new ResearchStore();
    const benefits = new BenefitStore();
    const privacy = new PrivacyService(repository, backgrounds, resumes, research, benefits);
    const { session } = repository.createSession({ ownerTokenHash, language: "en", country: "US", source: "conversation" });

    backgrounds.create({
      ownerTokenHash, sessionId: session.id, type: "manual", name: "Background notes",
      mimeType: null, byteSize: 12, sourceValue: "Role: Planner", extractedText: "Role: Planner",
      rawBytes: null, status: "ready", errorCode: null, fields: [],
    });
    resumes.save(ownerTokenHash, session.id, {
      name: "Test Person", contactLine: "test@example.com", targetRole: "Planner", summary: "Operations planner",
      experience: { role: "Planner", dates: "2020–2025", location: "Chicago", bullets: ["Planned work"] },
      skills: ["Planning"],
    }, [], true);
    repository.setPurposeForOwnedSession(ownerTokenHash, session.id, "product_research", true, "research-v1");
    new ResearchService(repository, research).create(ownerTokenHash, session.id, { noProblemObserved: true, fields: {} });
    new BenefitsService(repository, benefits).record(ownerTokenHash, session.id, "muse-community-directory", "open");

    expect(privacy.exportData(ownerTokenHash, session.id)).toMatchObject({
      backgroundAssets: [expect.objectContaining({ name: "Background notes" })],
      currentResume: expect.objectContaining({ version: 1 }),
      researchProblemCards: [expect.objectContaining({ noProblemObserved: true })],
      benefitActivity: [expect.objectContaining({ state: "opened" })],
    });

    expect(privacy.deleteData(ownerTokenHash, session.id).status).toBe("completed");
    expect(backgrounds.list(ownerTokenHash, session.id)).toEqual([]);
    expect(resumes.current(ownerTokenHash, session.id)).toBeNull();
    expect(research.listByOwner(ownerTokenHash, session.id)).toEqual([]);
    expect(benefits.listByOwner(ownerTokenHash, session.id)).toEqual([]);
    expect(() => repository.getOwnedSession(ownerTokenHash, session.id)).toThrowError(expect.objectContaining({ code: "DELETED" }));
  });
});
