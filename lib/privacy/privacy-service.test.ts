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
import { OperationStore } from "@/lib/observability/operation-store";
import { TranscriptionStore } from "@/lib/audio/transcription-store";

const ownerTokenHash = createHash("sha256").update("privacy-owner").digest("hex");
const otherOwnerTokenHash = createHash("sha256").update("privacy-owner-b").digest("hex");

describe("PrivacyService", () => {
  it("exports every local data class and deletes it across stores", () => {
    const repository = new LocalRepository();
    const backgrounds = new BackgroundStore();
    const resumes = new ResumeStore();
    const research = new ResearchStore();
    const benefits = new BenefitStore();
    const operations = new OperationStore();
    const transcriptions = new TranscriptionStore();
    const privacy = new PrivacyService(repository, backgrounds, resumes, research, benefits, operations, transcriptions);
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
    operations.record({
      ownerTokenHash, sessionId: session.id, operation: "interview_question", status: "success",
      latencyMs: 10, modelId: "model-a", modelVersion: null, promptVersion: "v1",
      inputTokens: 10, outputTokens: 5, estimatedCostUsd: null, failureCode: null,
    });
    const transcription = transcriptions.create({
      ownerTokenHash, sessionId: session.id, clientUploadId: "privacy-audio-1", language: "en",
      mimeType: "audio/webm", bytes: new Uint8Array([1, 2, 3]),
    });
    transcriptions.complete(transcription.id, "I coordinated the daily dispatch handoff.");

    const exported = privacy.exportData(ownerTokenHash, session.id);
    expect(exported).toMatchObject({
      backgroundAssets: [expect.objectContaining({ name: "Background notes" })],
      currentResume: expect.objectContaining({ version: 1 }),
      researchProblemCards: [expect.objectContaining({ noProblemObserved: true })],
      benefitActivity: [expect.objectContaining({ state: "opened" })],
      operationMetrics: expect.objectContaining({ total: 1, successes: 1 }),
      operationEvents: [expect.objectContaining({ operation: "interview_question" })],
      transcriptionJobs: [expect.objectContaining({ transcript: "I coordinated the daily dispatch handoff.", hasTemporaryAudio: true })],
    });
    expect(JSON.stringify(exported)).not.toContain(ownerTokenHash);

    expect(privacy.deleteData(ownerTokenHash, session.id).status).toBe("completed");
    expect(backgrounds.list(ownerTokenHash, session.id)).toEqual([]);
    expect(resumes.current(ownerTokenHash, session.id)).toBeNull();
    expect(research.listByOwner(ownerTokenHash, session.id)).toEqual([]);
    expect(benefits.listByOwner(ownerTokenHash, session.id)).toEqual([]);
    expect(operations.summary(ownerTokenHash).total).toBe(0);
    expect(() => transcriptions.get(ownerTokenHash, transcription.id)).toThrowError(expect.objectContaining({ code: "NOT_FOUND" }));
    expect(() => repository.getOwnedSession(ownerTokenHash, session.id)).toThrowError(expect.objectContaining({ code: "DELETED" }));
  });

  it("deletes one owner without changing another owner's data", () => {
    const repository = new LocalRepository();
    const backgrounds = new BackgroundStore();
    const resumes = new ResumeStore();
    const research = new ResearchStore();
    const benefits = new BenefitStore();
    const operations = new OperationStore();
    const transcriptions = new TranscriptionStore();
    const privacy = new PrivacyService(repository, backgrounds, resumes, research, benefits, operations, transcriptions);
    const { session: first } = repository.createSession({ ownerTokenHash, language: "en", country: "US", source: "conversation" });
    const { session: second } = repository.createSession({ ownerTokenHash: otherOwnerTokenHash, language: "en", country: "US", source: "conversation" });

    for (const [owner, session, suffix] of [[ownerTokenHash, first, "A"], [otherOwnerTokenHash, second, "B"]] as const) {
      backgrounds.create({
        ownerTokenHash: owner, sessionId: session.id, type: "manual", name: `Background ${suffix}`,
        mimeType: null, byteSize: 8, sourceValue: `Role ${suffix}`, extractedText: `Role ${suffix}`,
        rawBytes: null, status: "ready", errorCode: null, fields: [],
      });
      resumes.save(owner, session.id, {
        name: `Person ${suffix}`, contactLine: "", targetRole: "Planner", summary: `Summary ${suffix}`,
        experience: { role: "Planner", dates: "2020–2025", location: "", bullets: [`Result ${suffix}`] },
        skills: ["Planning"],
      }, [], true);
      repository.setPurposeForOwnedSession(owner, session.id, "product_research", true, "research-v1");
      new ResearchService(repository, research).create(owner, session.id, { noProblemObserved: true, fields: {} });
      new BenefitsService(repository, benefits).record(owner, session.id, "muse-community-directory", "open");
      operations.record({
        ownerTokenHash: owner, sessionId: session.id, operation: "interview_question", status: "success",
        latencyMs: 10, modelId: "model-a", modelVersion: null, promptVersion: "v1",
        inputTokens: 10, outputTokens: 5, estimatedCostUsd: null, failureCode: null,
      });
      transcriptions.create({
        ownerTokenHash: owner, sessionId: session.id, clientUploadId: `upload-${suffix}`, language: "en",
        mimeType: "audio/webm", bytes: new Uint8Array([1, 2, 3]),
      });
    }

    privacy.deleteData(ownerTokenHash, first.id);

    expect(backgrounds.list(otherOwnerTokenHash, second.id)).toHaveLength(1);
    expect(resumes.current(otherOwnerTokenHash, second.id)).not.toBeNull();
    expect(research.listByOwner(otherOwnerTokenHash, second.id)).toHaveLength(1);
    expect(benefits.listByOwner(otherOwnerTokenHash, second.id)).toHaveLength(1);
    expect(operations.exportForOwner(otherOwnerTokenHash)).toHaveLength(1);
    expect(transcriptions.exportForOwner(otherOwnerTokenHash)).toHaveLength(1);
    expect(repository.getOwnedSession(otherOwnerTokenHash, second.id).id).toBe(second.id);
  });
});
