import type { ResumeVersion } from "@/lib/outputs/resume-store";

export function publicResumeVersion(version: ResumeVersion) {
  return {
    id: version.id,
    sessionId: version.sessionId,
    version: version.version,
    content: version.content,
    status: version.status,
    missing: version.missing,
    sourceConflicts: version.sourceConflicts,
    userConfirmed: version.userConfirmed,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}
