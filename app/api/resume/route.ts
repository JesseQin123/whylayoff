import { NextResponse } from "next/server";
import { resumeSaveSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { resumeStore } from "@/lib/outputs/resume-store";
import { publicResumeVersion } from "@/lib/outputs/public";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

export async function POST(request: Request) {
  try {
    const token = await getOwnerToken();
    if (!token) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = resumeSaveSchema.parse(await request.json());
    const ownerTokenHash = hashOwnerToken(token);
    const snapshot = repository.getSessionSnapshot(ownerTokenHash, input.sessionId);
    const conflicts = snapshot.facts.filter((fact) => fact.status === "contradicted").map((fact) => fact.field);
    const version = resumeStore.save(ownerTokenHash, input.sessionId, input.content, conflicts, input.userConfirmed);
    return NextResponse.json({ resume: publicResumeVersion(version) });
  } catch (error) {
    return apiError(error);
  }
}
