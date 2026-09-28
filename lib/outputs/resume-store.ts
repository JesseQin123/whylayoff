import { randomUUID } from "node:crypto";
import type { ResumeContent } from "@/lib/outputs/generate";
import { missingResumeInformation } from "@/lib/outputs/generate";

export type ResumeVersion = {
  id: string;
  ownerTokenHash: string;
  sessionId: string;
  version: number;
  content: ResumeContent;
  status: "facts_incomplete" | "fact_review" | "ready_to_export";
  missing: string[];
  sourceConflicts: string[];
  userConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export class ResumeStore {
  private versions = new Map<string, ResumeVersion[]>();

  current(ownerTokenHash: string, sessionId: string) {
    return this.versions.get(`${ownerTokenHash}:${sessionId}`)?.at(-1) ?? null;
  }

  create(ownerTokenHash: string, sessionId: string, content: ResumeContent, sourceConflicts: string[]) {
    const existing = this.current(ownerTokenHash, sessionId);
    if (existing) return existing;
    return this.save(ownerTokenHash, sessionId, content, sourceConflicts, false);
  }

  save(ownerTokenHash: string, sessionId: string, content: ResumeContent, sourceConflicts: string[], userConfirmed: boolean) {
    const key = `${ownerTokenHash}:${sessionId}`;
    const versions = this.versions.get(key) ?? [];
    const missing = missingResumeInformation(content);
    const timestamp = new Date().toISOString();
    const status = missing.length > 0 || sourceConflicts.length > 0
      ? "facts_incomplete"
      : userConfirmed ? "ready_to_export" : "fact_review";
    const version: ResumeVersion = {
      id: randomUUID(),
      ownerTokenHash,
      sessionId,
      version: versions.length + 1,
      content,
      status,
      missing,
      sourceConflicts,
      userConfirmed: userConfirmed && status === "ready_to_export",
      createdAt: versions[0]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    versions.push(version);
    this.versions.set(key, versions);
    return version;
  }

  deleteForOwner(ownerTokenHash: string) {
    for (const key of this.versions.keys()) if (key.startsWith(`${ownerTokenHash}:`)) this.versions.delete(key);
  }

  dumpOwnerState(ownerTokenHash: string) {
    return [...this.versions.entries()]
      .filter(([key]) => key.startsWith(`${ownerTokenHash}:`))
      .flatMap(([, versions]) => structuredClone(versions));
  }

  restoreOwnerState(ownerTokenHash: string, versions: ResumeVersion[]) {
    this.deleteForOwner(ownerTokenHash);
    for (const version of versions) {
      const restored = { ...version, ownerTokenHash };
      const key = `${ownerTokenHash}:${restored.sessionId}`;
      const existing = this.versions.get(key) ?? [];
      existing.push(restored);
      existing.sort((left, right) => left.version - right.version);
      this.versions.set(key, existing);
    }
  }
}

declare global {
  var nextChapterResumeStore: ResumeStore | undefined;
}

export const resumeStore = globalThis.nextChapterResumeStore ?? new ResumeStore();
globalThis.nextChapterResumeStore = resumeStore;
