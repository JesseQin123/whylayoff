import { operationStore, type OperationEvent } from "@/lib/observability/operation-store";

type RecordOperationInput = {
  ownerTokenHash: string;
  sessionId: string;
  operation: OperationEvent["operation"];
  status: OperationEvent["status"];
  modelId: string;
  startedAt?: number;
  modelVersion?: string | null;
  promptVersion?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
  failureCode?: OperationEvent["failureCode"];
};

export function recordOperation(input: RecordOperationInput) {
  return operationStore.record({
    ownerTokenHash: input.ownerTokenHash,
    sessionId: input.sessionId,
    operation: input.operation,
    status: input.status,
    latencyMs: input.startedAt == null ? 0 : performance.now() - input.startedAt,
    modelId: input.modelId,
    modelVersion: input.modelVersion ?? null,
    promptVersion: input.promptVersion ?? null,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    estimatedCostUsd: input.estimatedCostUsd ?? null,
    failureCode: input.failureCode ?? null,
  });
}
