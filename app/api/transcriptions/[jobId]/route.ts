import { NextResponse } from "next/server";
import { transcriptionStore } from "@/lib/audio/transcription-store";
import { publicTranscriptionJob } from "@/lib/audio/transcribe";
import { getOwnerContext } from "@/lib/server/ownership";

type Context = { params: Promise<{ jobId: string }> };

function errorResponse(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? error.code : "NOT_FOUND";
  return NextResponse.json({ error: code }, { status: code === "FORBIDDEN" ? 403 : 404 });
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { jobId } = await params;
    return NextResponse.json({ job: publicTranscriptionJob(transcriptionStore.get(owner.ownerTokenHash, jobId)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { jobId } = await params;
    const result = transcriptionStore.delete(owner.ownerTokenHash, jobId);
    await owner.persistence.save();
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
