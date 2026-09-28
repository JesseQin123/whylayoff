import { transcriptionStore, type TranscriptionJob } from "@/lib/audio/transcription-store";
import { operationStore } from "@/lib/observability/operation-store";

export async function transcribeJob(job: TranscriptionJob) {
  const baseUrl = process.env.AUDIO_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.AUDIO_API_KEY;
  const model = process.env.AUDIO_TRANSCRIPTION_MODEL;
  if (!baseUrl || !apiKey || !model || !job.audio) {
    operationStore.record({
      operation: "audio_transcription", status: "fallback", latencyMs: 0,
      modelId: model ?? "not-configured", modelVersion: null, promptVersion: null,
      inputTokens: null, outputTokens: null, estimatedCostUsd: null,
      failureCode: "TRANSCRIPTION_NOT_CONFIGURED",
    });
    return transcriptionStore.fail(job.id, "TRANSCRIPTION_NOT_CONFIGURED");
  }
  const startedAt = performance.now();
  try {
    const form = new FormData();
    form.set("model", model);
    form.set("language", job.language);
    const audioBuffer = new ArrayBuffer(job.audio.byteLength);
    new Uint8Array(audioBuffer).set(job.audio);
    form.set("file", new File([audioBuffer], `recording.${job.mimeType.includes("mp4") ? "m4a" : "webm"}`, { type: job.mimeType }));
    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      operationStore.record({
        operation: "audio_transcription", status: "failure", latencyMs: performance.now() - startedAt,
        modelId: model, modelVersion: process.env.AUDIO_MODEL_VERSION ?? null, promptVersion: null,
        inputTokens: null, outputTokens: null, estimatedCostUsd: null,
        failureCode: `PROVIDER_${response.status}`,
      });
      return transcriptionStore.fail(job.id, `PROVIDER_${response.status}`);
    }
    const payload = await response.json() as { text?: string };
    if (!payload.text?.trim()) {
      operationStore.record({
        operation: "audio_transcription", status: "failure", latencyMs: performance.now() - startedAt,
        modelId: model, modelVersion: process.env.AUDIO_MODEL_VERSION ?? null, promptVersion: null,
        inputTokens: null, outputTokens: null, estimatedCostUsd: null, failureCode: "EMPTY_TRANSCRIPT",
      });
      return transcriptionStore.fail(job.id, "EMPTY_TRANSCRIPT");
    }
    operationStore.record({
      operation: "audio_transcription", status: "success", latencyMs: performance.now() - startedAt,
      modelId: model, modelVersion: process.env.AUDIO_MODEL_VERSION ?? null, promptVersion: null,
      inputTokens: null, outputTokens: null, estimatedCostUsd: null, failureCode: null,
    });
    return transcriptionStore.complete(job.id, payload.text.trim());
  } catch {
    operationStore.record({
      operation: "audio_transcription", status: "failure", latencyMs: performance.now() - startedAt,
      modelId: model, modelVersion: process.env.AUDIO_MODEL_VERSION ?? null, promptVersion: null,
      inputTokens: null, outputTokens: null, estimatedCostUsd: null, failureCode: "TRANSCRIPTION_FAILED",
    });
    return transcriptionStore.fail(job.id, "TRANSCRIPTION_FAILED");
  }
}

export function publicTranscriptionJob(job: TranscriptionJob) {
  return {
    id: job.id,
    status: job.status,
    transcript: job.transcript,
    errorCode: job.errorCode,
    mimeType: job.mimeType,
    size: job.size,
    createdAt: job.createdAt,
    deleteAfter: job.deleteAfter,
  };
}
