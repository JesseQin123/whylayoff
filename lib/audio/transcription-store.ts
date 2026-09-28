import { randomUUID } from "node:crypto";

export type TranscriptionJob = {
  id: string;
  ownerTokenHash: string;
  sessionId: string;
  clientUploadId: string;
  language: string;
  mimeType: string;
  size: number;
  status: "processing" | "completed" | "failed";
  transcript: string | null;
  errorCode: string | null;
  createdAt: string;
  deleteAfter: string;
  audio: Uint8Array | null;
};

export class TranscriptionAccessError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "FORBIDDEN") {
    super(message);
  }
}

export class TranscriptionStore {
  private jobs = new Map<string, TranscriptionJob>();
  private uploads = new Map<string, string>();

  create(input: {
    ownerTokenHash: string;
    sessionId: string;
    clientUploadId: string;
    language: string;
    mimeType: string;
    bytes: Uint8Array;
  }) {
    this.cleanupExpired();
    const uploadKey = `${input.ownerTokenHash}:${input.clientUploadId}`;
    const existingId = this.uploads.get(uploadKey);
    if (existingId) return this.jobs.get(existingId)!;
    const createdAt = new Date();
    const job: TranscriptionJob = {
      id: randomUUID(),
      ownerTokenHash: input.ownerTokenHash,
      sessionId: input.sessionId,
      clientUploadId: input.clientUploadId,
      language: input.language,
      mimeType: input.mimeType,
      size: input.bytes.byteLength,
      status: "processing",
      transcript: null,
      errorCode: null,
      createdAt: createdAt.toISOString(),
      deleteAfter: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      audio: input.bytes,
    };
    this.jobs.set(job.id, job);
    this.uploads.set(uploadKey, job.id);
    return job;
  }

  get(ownerTokenHash: string, jobId: string) {
    this.cleanupExpired();
    const job = this.jobs.get(jobId);
    if (!job) throw new TranscriptionAccessError("Transcription job not found", "NOT_FOUND");
    if (job.ownerTokenHash !== ownerTokenHash) throw new TranscriptionAccessError("Transcription job is not owned", "FORBIDDEN");
    return job;
  }

  complete(jobId: string, transcript: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new TranscriptionAccessError("Transcription job not found", "NOT_FOUND");
    job.status = "completed";
    job.transcript = transcript;
    job.errorCode = null;
    return job;
  }

  fail(jobId: string, errorCode: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new TranscriptionAccessError("Transcription job not found", "NOT_FOUND");
    job.status = "failed";
    job.errorCode = errorCode;
    return job;
  }

  delete(ownerTokenHash: string, jobId: string) {
    const job = this.get(ownerTokenHash, jobId);
    job.audio = null;
    this.jobs.delete(jobId);
    this.uploads.delete(`${job.ownerTokenHash}:${job.clientUploadId}`);
    return { status: "deleted" as const };
  }

  exportForOwner(ownerTokenHash: string) {
    this.cleanupExpired();
    return [...this.jobs.values()]
      .filter((job) => job.ownerTokenHash === ownerTokenHash)
      .map((job) => ({
        id: job.id,
        sessionId: job.sessionId,
        clientUploadId: job.clientUploadId,
        language: job.language,
        mimeType: job.mimeType,
        size: job.size,
        status: job.status,
        transcript: job.transcript,
        errorCode: job.errorCode,
        createdAt: job.createdAt,
        deleteAfter: job.deleteAfter,
        hasTemporaryAudio: job.audio != null,
      }));
  }

  deleteForOwner(ownerTokenHash: string) {
    for (const [jobId, job] of this.jobs) {
      if (job.ownerTokenHash !== ownerTokenHash) continue;
      job.audio = null;
      this.jobs.delete(jobId);
      this.uploads.delete(`${job.ownerTokenHash}:${job.clientUploadId}`);
    }
  }

  dumpOwnerState(ownerTokenHash: string) {
    this.cleanupExpired();
    return [...this.jobs.values()]
      .filter((job) => job.ownerTokenHash === ownerTokenHash)
      .map((job) => ({ ...structuredClone(job), audio: null }));
  }

  restoreOwnerState(ownerTokenHash: string, jobs: TranscriptionJob[]) {
    this.deleteForOwner(ownerTokenHash);
    for (const job of jobs) {
      const restored = { ...job, ownerTokenHash, audio: null };
      if (restored.status === "processing") {
        restored.status = "failed";
        restored.errorCode = "TRANSCRIPTION_INTERRUPTED";
      }
      this.jobs.set(restored.id, restored);
      this.uploads.set(`${ownerTokenHash}:${restored.clientUploadId}`, restored.id);
    }
  }

  private cleanupExpired() {
    const timestamp = Date.now();
    for (const [jobId, job] of this.jobs) {
      if (Date.parse(job.deleteAfter) <= timestamp) {
        this.jobs.delete(jobId);
        this.uploads.delete(`${job.ownerTokenHash}:${job.clientUploadId}`);
      }
    }
  }
}

declare global {
  var nextChapterTranscriptionStore: TranscriptionStore | undefined;
}

export const transcriptionStore = globalThis.nextChapterTranscriptionStore ?? new TranscriptionStore();
globalThis.nextChapterTranscriptionStore = transcriptionStore;
