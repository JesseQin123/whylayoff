export type OperationFailureCode =
  | "GATEWAY_DISABLED"
  | "INVALID_MODEL_OUTPUT"
  | "TIMEOUT"
  | "MODEL_REQUEST_FAILED"
  | "MODEL_ATTEMPTS_EXHAUSTED"
  | "TRANSCRIPTION_NOT_CONFIGURED"
  | "EMPTY_TRANSCRIPT"
  | "TRANSCRIPTION_FAILED"
  | `GATEWAY_${number}`
  | `PROVIDER_${number}`;

export type OperationEvent = {
  id: string;
  ownerTokenHash: string;
  sessionId: string;
  operation: "interview_question" | "audio_transcription";
  status: "success" | "failure" | "fallback";
  latencyMs: number;
  modelId: string;
  modelVersion: string | null;
  promptVersion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  failureCode: OperationFailureCode | null;
  createdAt: string;
};

export type OperationEventInput = Omit<OperationEvent, "id" | "createdAt">;

function publicOperationEvent(event: OperationEvent) {
  return {
    id: event.id,
    operation: event.operation,
    status: event.status,
    latencyMs: event.latencyMs,
    modelId: event.modelId,
    modelVersion: event.modelVersion,
    promptVersion: event.promptVersion,
    inputTokens: event.inputTokens,
    outputTokens: event.outputTokens,
    estimatedCostUsd: event.estimatedCostUsd,
    failureCode: event.failureCode,
    createdAt: event.createdAt,
  };
}

export class OperationStore {
  private events: OperationEvent[] = [];

  record(input: OperationEventInput) {
    const event: OperationEvent = {
      ...input,
      id: crypto.randomUUID(),
      latencyMs: Math.max(0, Math.round(input.latencyMs)),
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    if (this.events.length > 500) this.events.splice(0, this.events.length - 500);
    return event;
  }

  list() {
    return this.events.map((event) => ({ ...event }));
  }

  exportForOwner(ownerTokenHash: string) {
    return this.events
      .filter((event) => event.ownerTokenHash === ownerTokenHash)
      .map(publicOperationEvent);
  }

  summary(ownerTokenHash: string) {
    const ownedEvents = this.events.filter((event) => event.ownerTokenHash === ownerTokenHash);
    const total = ownedEvents.length;
    const completed = ownedEvents.filter((event) => event.status === "success");
    const costedEvents = ownedEvents.filter((event) => event.estimatedCostUsd != null);
    const cost = costedEvents.reduce((sum, event) => sum + event.estimatedCostUsd!, 0);
    return {
      total,
      successes: completed.length,
      failures: ownedEvents.filter((event) => event.status === "failure").length,
      fallbacks: ownedEvents.filter((event) => event.status === "fallback").length,
      averageLatencyMs: total ? Math.round(ownedEvents.reduce((sum, event) => sum + event.latencyMs, 0) / total) : 0,
      estimatedCostUsd: costedEvents.length ? Number(cost.toFixed(6)) : null,
      unknownCostOperations: total - costedEvents.length,
      events: ownedEvents.slice(-50).reverse().map(publicOperationEvent),
    };
  }

  deleteForOwner(ownerTokenHash: string) {
    this.events = this.events.filter((event) => event.ownerTokenHash !== ownerTokenHash);
  }

  dumpOwnerState(ownerTokenHash: string) {
    return structuredClone(this.events.filter((event) => event.ownerTokenHash === ownerTokenHash));
  }

  restoreOwnerState(ownerTokenHash: string, events: OperationEvent[]) {
    this.deleteForOwner(ownerTokenHash);
    this.events.push(...events.map((event) => ({ ...event, ownerTokenHash })));
    if (this.events.length > 500) this.events.splice(0, this.events.length - 500);
  }
}

declare global {
  var nextChapterOperationStore: OperationStore | undefined;
}

export const operationStore = globalThis.nextChapterOperationStore ?? new OperationStore();
globalThis.nextChapterOperationStore = operationStore;
