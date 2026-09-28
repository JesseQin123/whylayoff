import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { resumeStore } from "@/lib/outputs/resume-store";
import { resumeToDocx, resumeToPdf, resumeToPlainText } from "@/lib/outputs/export";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

export async function GET(request: Request) {
  const token = await getOwnerToken();
  if (!token) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const format = url.searchParams.get("format") ?? "text";
  const ownerTokenHash = hashOwnerToken(token);
  try {
    repository.getOwnedSession(ownerTokenHash, sessionId);
    const version = resumeStore.current(ownerTokenHash, sessionId);
    if (!version) return NextResponse.json({ error: "RESUME_NOT_FOUND" }, { status: 404 });
    if (format !== "text" && version.status !== "ready_to_export") {
      return NextResponse.json({ error: "FACT_REVIEW_REQUIRED", missing: version.missing, conflicts: version.sourceConflicts }, { status: 409 });
    }
    if (format === "docx") {
      const bytes = await resumeToDocx(version.content);
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": "attachment; filename=next-chapter-resume.docx",
        },
      });
    }
    if (format === "pdf") {
      const bytes = await resumeToPdf(version.content);
      const pdfBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(pdfBuffer).set(bytes);
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=next-chapter-resume.pdf",
        },
      });
    }
    return new NextResponse(resumeToPlainText(version.content), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
