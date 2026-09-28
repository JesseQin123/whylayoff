import { NextResponse } from "next/server";
import { transcriptionStore } from "@/lib/audio/transcription-store";
import { publicTranscriptionJob } from "@/lib/audio/transcribe";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

type Context = { params: Promise<{ jobId: string }> };

function errorResponse(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? error.code : "NOT_FOUND";
  return NextResponse.json({ error: code }, { status: code === "FORBIDDEN" ? 403 : 404 });
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const token = await getOwnerToken();
    if (!token) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { jobId } = await params;
    return NextResponse.json({ job: publicTranscriptionJob(transcriptionStore.get(hashOwnerToken(token), jobId)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const token = await getOwnerToken();
    if (!token) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { jobId } = await params;
    return NextResponse.json(transcriptionStore.delete(hashOwnerToken(token), jobId));
  } catch (error) {
    return errorResponse(error);
  }
}
