import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { transcriptionStore } from "@/lib/audio/transcription-store";
import { publicTranscriptionJob, transcribeJob } from "@/lib/audio/transcribe";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { apiError } from "@/lib/server/api-response";
import { hasExpectedAudioSignature } from "@/lib/audio/validation";

const allowedTypes = new Set(["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg", "audio/ogg;codecs=opus"]);

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const ownerTokenHash = hashOwnerToken(ownerToken);
    const form = await request.formData();
    const sessionId = String(form.get("sessionId") ?? "");
    const clientUploadId = String(form.get("clientUploadId") ?? "");
    const language = String(form.get("language") ?? "en").slice(0, 12);
    const file = form.get("audio");
    repository.getOwnedSession(ownerTokenHash, sessionId);
    if (!(file instanceof File) || !clientUploadId || clientUploadId.length > 100) {
      return NextResponse.json({ error: "INVALID_UPLOAD" }, { status: 400 });
    }
    if (!allowedTypes.has(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "UNSUPPORTED_AUDIO" }, { status: 415 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedAudioSignature(file.type, bytes)) {
      return NextResponse.json({ error: "AUDIO_CONTENT_MISMATCH" }, { status: 415 });
    }
    const job = transcriptionStore.create({
      ownerTokenHash,
      sessionId,
      clientUploadId,
      language,
      mimeType: file.type,
      bytes,
    });
    if (job.status === "processing") await transcribeJob(job);
    return NextResponse.json({ job: publicTranscriptionJob(job) }, { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}
