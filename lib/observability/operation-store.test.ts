import { describe, expect, it } from "vitest";
import { OperationStore } from "@/lib/observability/operation-store";

describe("OperationStore", () => {
  it("records operational metadata without raw participant content", () => {
    const store = new OperationStore();
    const event = store.record({
      ownerTokenHash: "owner-a",
      sessionId: "session-a",
      operation: "interview_question",
      status: "success",
      latencyMs: 124.7,
      modelId: "model-a",
      modelVersion: "2026-09",
      promptVersion: "interview-question-v1",
      inputTokens: 120,
      outputTokens: 25,
      estimatedCostUsd: 0.0004,
      failureCode: null,
    });

    expect(event.latencyMs).toBe(125);
    expect(JSON.stringify(event)).not.toContain("resume");
    expect(JSON.stringify(event)).not.toContain("previousAnswer");
    expect(store.summary("owner-a")).toMatchObject({ total: 1, successes: 1, failures: 0, estimatedCostUsd: 0.0004 });
    expect(store.summary("owner-b")).toMatchObject({ total: 0, successes: 0 });
    expect(JSON.stringify(store.summary("owner-a"))).not.toContain("owner-a");
  });

  it("reports unknown cost instead of converting it to zero", () => {
    const store = new OperationStore();
    store.record({
      ownerTokenHash: "owner-a", sessionId: "session-a", operation: "audio_transcription",
      status: "failure", latencyMs: 20, modelId: "audio-a", modelVersion: null,
      promptVersion: null, inputTokens: null, outputTokens: null, estimatedCostUsd: null,
      failureCode: "TRANSCRIPTION_FAILED",
    });
    expect(store.summary("owner-a")).toMatchObject({ estimatedCostUsd: null, unknownCostOperations: 1 });
  });

  it("exports every owned event without internal ownership identifiers", () => {
    const store = new OperationStore();
    for (let index = 0; index < 60; index += 1) {
      store.record({
        ownerTokenHash: "owner-a", sessionId: "session-a", operation: "interview_question",
        status: "success", latencyMs: index, modelId: "model-a", modelVersion: null,
        promptVersion: "v1", inputTokens: 10, outputTokens: 5, estimatedCostUsd: 0.0001,
        failureCode: null,
      });
    }
    store.record({
      ownerTokenHash: "owner-b", sessionId: "session-b", operation: "interview_question",
      status: "success", latencyMs: 1, modelId: "model-b", modelVersion: null,
      promptVersion: "v1", inputTokens: 1, outputTokens: 1, estimatedCostUsd: null,
      failureCode: null,
    });

    expect(store.summary("owner-a").events).toHaveLength(50);
    expect(store.exportForOwner("owner-a")).toHaveLength(60);
    expect(JSON.stringify(store.exportForOwner("owner-a"))).not.toContain("owner-a");
    expect(JSON.stringify(store.exportForOwner("owner-a"))).not.toContain("session-a");
  });
});
