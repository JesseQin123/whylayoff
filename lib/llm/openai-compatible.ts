import { z } from "zod";
import type { InterviewIntent } from "@/lib/interview/intents";
import { localizedQuestion } from "@/lib/interview/intents";
import { recordOperation } from "@/lib/observability/record-operation";

const questionOutputSchema = z.object({
  acknowledgement: z.string().max(240),
  question: z.string().min(4).max(400),
}).strict();

type FormatQuestionInput = {
  intent: InterviewIntent;
  language: string;
  previousAnswer: string;
  ownerTokenHash: string;
  sessionId: string;
};

function deterministicQuestion({ intent, language }: FormatQuestionInput) {
  return localizedQuestion(intent, language);
}

async function callModel(model: string, input: FormatQuestionInput) {
  const baseUrl = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.LLM_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Gateway is not configured");
  const prompt = [
    "You are a careful career interviewer.",
    `Language: ${input.language}`,
    `Selected intent: ${input.intent.id}`,
    `Intent question: ${localizedQuestion(input.intent, input.language)}`,
    `Participant's previous answer: ${input.previousAnswer.slice(0, 1200)}`,
    "Return JSON with exactly two string keys: acknowledgement and question.",
    "Ask exactly one question. Keep the selected intent. Do not add facts, permissions, identity fields, prices, benefits, or claims about why a layoff happened.",
  ].join("\n");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Gateway returned no content");
  const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
  return {
    output: questionOutputSchema.parse(JSON.parse(jsonText)),
    usage: {
      inputTokens: payload.usage?.prompt_tokens ?? null,
      outputTokens: payload.usage?.completion_tokens ?? null,
    },
  };
}

function estimatedCost(inputTokens: number | null, outputTokens: number | null) {
  const inputRateValue = process.env.LLM_INPUT_USD_PER_MILLION;
  const outputRateValue = process.env.LLM_OUTPUT_USD_PER_MILLION;
  if (!inputRateValue || !outputRateValue) return null;
  const inputRate = Number(inputRateValue);
  const outputRate = Number(outputRateValue);
  if (inputTokens == null || outputTokens == null || !Number.isFinite(inputRate) || !Number.isFinite(outputRate)) return null;
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
}

function modelFailureCode(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError) return "INVALID_MODEL_OUTPUT";
  if (error instanceof Error && error.name === "TimeoutError") return "TIMEOUT";
  if (error instanceof Error && error.message.startsWith("Gateway returned ")) {
    return `GATEWAY_${error.message.replace("Gateway returned ", "")}`;
  }
  return "MODEL_REQUEST_FAILED";
}

export async function formatNextQuestion(input: FormatQuestionInput) {
  if (process.env.LLM_MODE !== "gateway") {
    recordOperation({
      ownerTokenHash: input.ownerTokenHash,
      sessionId: input.sessionId,
      operation: "interview_question",
      status: "fallback",
      modelId: "deterministic",
      promptVersion: "interview-question-v1",
      estimatedCostUsd: 0,
      failureCode: "GATEWAY_DISABLED",
    });
    return deterministicQuestion(input);
  }
  const models = [process.env.LLM_INTERVIEW_MODEL, process.env.LLM_FALLBACK_MODEL].filter(Boolean) as string[];
  for (const [modelIndex, model] of models.entries()) {
    const attempts = modelIndex === 0 ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const startedAt = performance.now();
      try {
        const { output, usage } = await callModel(model, input);
        recordOperation({
          ownerTokenHash: input.ownerTokenHash,
          sessionId: input.sessionId,
          operation: "interview_question",
          status: "success",
          startedAt,
          modelId: model,
          modelVersion: process.env.LLM_MODEL_VERSION ?? null,
          promptVersion: "interview-question-v1",
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCostUsd: estimatedCost(usage.inputTokens, usage.outputTokens),
        });
        return output.acknowledgement ? `${output.acknowledgement} ${output.question}` : output.question;
      } catch (error) {
        recordOperation({
          ownerTokenHash: input.ownerTokenHash,
          sessionId: input.sessionId,
          operation: "interview_question",
          status: "failure",
          startedAt,
          modelId: model,
          modelVersion: process.env.LLM_MODEL_VERSION ?? null,
          promptVersion: "interview-question-v1",
          failureCode: modelFailureCode(error),
        });
        console.warn("Question model attempt failed", {
          model,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }
  recordOperation({
    ownerTokenHash: input.ownerTokenHash,
    sessionId: input.sessionId,
    operation: "interview_question",
    status: "fallback",
    modelId: "deterministic",
    promptVersion: "interview-question-v1",
    estimatedCostUsd: 0,
    failureCode: "MODEL_ATTEMPTS_EXHAUSTED",
  });
  return deterministicQuestion(input);
}
