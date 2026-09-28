import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { generateCareerDirections, generateResumeContent, generateSkills } from "@/lib/outputs/generate";
import { resumeStore } from "@/lib/outputs/resume-store";
import { publicResumeVersion } from "@/lib/outputs/public";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";

export async function GET(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
    const ownerTokenHash = owner.ownerTokenHash;
    const snapshot = repository.getSessionSnapshot(ownerTokenHash, sessionId);
    const conflicts = snapshot.facts.filter((fact) => fact.status === "contradicted").map((fact) => fact.field);
    const resume = resumeStore.create(
      ownerTokenHash,
      sessionId,
      generateResumeContent(snapshot.facts),
      conflicts,
    );
    await owner.persistence.save();
    return NextResponse.json({
      skills: generateSkills(snapshot.facts),
      career: generateCareerDirections(snapshot.facts),
      resume: publicResumeVersion(resume),
    });
  } catch (error) {
    return apiError(error);
  }
}
