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
  failureCode: string | null;
  createdAt: string;
};

export type OperationEventInput = Omit<OperationEvent, "id" | "createdAt">;

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

  summary(ownerTokenHash: string) {
    const ownedEvents = this.events.filter((event) => event.ownerTokenHash === ownerTokenHash);
    const total = ownedEvents.length;
    const completed = ownedEvents.filter((event) => event.status === "success");
    const cost = ownedEvents.reduce((sum, event) => sum + (event.estimatedCostUsd ?? 0), 0);
    return {
      total,
      successes: completed.length,
      failures: ownedEvents.filter((event) => event.status === "failure").length,
      fallbacks: ownedEvents.filter((event) => event.status === "fallback").length,
      averageLatencyMs: total ? Math.round(ownedEvents.reduce((sum, event) => sum + event.latencyMs, 0) / total) : 0,
      estimatedCostUsd: Number(cost.toFixed(6)),
      events: ownedEvents.slice(-50).reverse().map((event) => ({
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
      })),
    };
  }

  deleteForOwner(ownerTokenHash: string) {
    this.events = this.events.filter((event) => event.ownerTokenHash !== ownerTokenHash);
  }
}

declare global {
  var nextChapterOperationStore: OperationStore | undefined;
}

export const operationStore = globalThis.nextChapterOperationStore ?? new OperationStore();
globalThis.nextChapterOperationStore = operationStore;
