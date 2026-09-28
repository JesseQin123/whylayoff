import { transcriptionStore, type TranscriptionJob } from "@/lib/audio/transcription-store";
import { recordOperation } from "@/lib/observability/record-operation";

function recordTranscription(
  job: TranscriptionJob,
  status: "success" | "failure" | "fallback",
  modelId: string,
  failureCode: string | null,
  startedAt?: number,
) {
  recordOperation({
    ownerTokenHash: job.ownerTokenHash,
    sessionId: job.sessionId,
    operation: "audio_transcription",
    status,
    modelId,
    modelVersion: process.env.AUDIO_MODEL_VERSION ?? null,
    failureCode,
    startedAt,
  });
}

export async function transcribeJob(job: TranscriptionJob) {
  const baseUrl = process.env.AUDIO_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.AUDIO_API_KEY;
  const model = process.env.AUDIO_TRANSCRIPTION_MODEL;
  if (!baseUrl || !apiKey || !model || !job.audio) {
    recordTranscription(job, "fallback", model ?? "not-configured", "TRANSCRIPTION_NOT_CONFIGURED");
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
      recordTranscription(job, "failure", model, `PROVIDER_${response.status}`, startedAt);
      return transcriptionStore.fail(job.id, `PROVIDER_${response.status}`);
    }
    const payload = await response.json() as { text?: string };
    if (!payload.text?.trim()) {
      recordTranscription(job, "failure", model, "EMPTY_TRANSCRIPT", startedAt);
      return transcriptionStore.fail(job.id, "EMPTY_TRANSCRIPT");
    }
    recordTranscription(job, "success", model, null, startedAt);
    return transcriptionStore.complete(job.id, payload.text.trim());
  } catch {
    recordTranscription(job, "failure", model, "TRANSCRIPTION_FAILED", startedAt);
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
