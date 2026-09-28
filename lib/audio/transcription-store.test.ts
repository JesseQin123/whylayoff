import { describe, expect, it } from "vitest";
import { TranscriptionStore } from "@/lib/audio/transcription-store";

const input = {
  ownerTokenHash: "owner-a",
  sessionId: "session-a",
  clientUploadId: "upload-0001",
  language: "en",
  mimeType: "audio/webm",
  bytes: new Uint8Array([1, 2, 3]),
};

describe("TranscriptionStore", () => {
  it("deduplicates uploads by owner and client upload id", () => {
    const store = new TranscriptionStore();
    const first = store.create(input);
    const duplicate = store.create(input);

    expect(duplicate.id).toBe(first.id);
  });

  it("isolates jobs between owners", () => {
    const store = new TranscriptionStore();
    const job = store.create(input);

    expect(() => store.get("owner-b", job.id)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("removes temporary audio when a job is deleted", () => {
    const store = new TranscriptionStore();
    const job = store.create(input);

    expect(store.delete("owner-a", job.id)).toEqual({ status: "deleted" });
    expect(() => store.get("owner-a", job.id)).toThrowError(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});
