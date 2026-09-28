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
});
