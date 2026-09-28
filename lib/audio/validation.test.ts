import { describe, expect, it } from "vitest";
import { hasExpectedAudioSignature } from "@/lib/audio/validation";

describe("audio signature validation", () => {
  it("accepts expected WebM, Ogg, and MP4 signatures", () => {
    expect(hasExpectedAudioSignature("audio/webm", new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00]))).toBe(true);
    expect(hasExpectedAudioSignature("audio/ogg", new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00]))).toBe(true);
    expect(hasExpectedAudioSignature("audio/mp4", new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0]))).toBe(true);
  });

  it("rejects content that only claims to be audio", () => {
    expect(hasExpectedAudioSignature("audio/webm", new TextEncoder().encode("not really webm"))).toBe(false);
  });
});
