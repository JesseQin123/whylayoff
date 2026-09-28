import { afterEach, describe, expect, it, vi } from "vitest";
import { interviewIntents } from "@/lib/interview/intents";
import { formatNextQuestion } from "@/lib/llm/openai-compatible";
import { operationStore } from "@/lib/observability/operation-store";

const ownerTokenHash = "empty-model-owner";

afterEach(() => {
  operationStore.deleteForOwner(ownerTokenHash);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("formatNextQuestion observability", () => {
  it("retains usage and cost when a successful gateway response has no content", async () => {
    vi.stubEnv("LLM_MODE", "gateway");
    vi.stubEnv("LLM_BASE_URL", "https://gateway.example.test/v1");
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_INTERVIEW_MODEL", "model-a");
    vi.stubEnv("LLM_FALLBACK_MODEL", "");
    vi.stubEnv("LLM_INPUT_USD_PER_MILLION", "2");
    vi.stubEnv("LLM_OUTPUT_USD_PER_MILLION", "4");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [],
      usage: { prompt_tokens: 20, completion_tokens: 5 },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const question = await formatNextQuestion({
      intent: interviewIntents[0]!, language: "en", previousAnswer: "", ownerTokenHash, sessionId: "session-a",
    });

    expect(question).toBe(interviewIntents[0]!.question.en);
    const failures = operationStore.exportForOwner(ownerTokenHash).filter((event) => event.status === "failure");
    expect(failures).toHaveLength(2);
    expect(failures[0]).toMatchObject({
      failureCode: "INVALID_MODEL_OUTPUT", inputTokens: 20, outputTokens: 5, estimatedCostUsd: 0.00006,
    });
  });
});
