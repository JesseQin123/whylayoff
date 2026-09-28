import { NextResponse } from "next/server";
import { z } from "zod";
import { backgroundStore } from "@/lib/background/background-store";
import { candidateFields, detectDocumentType, extractDocumentText } from "@/lib/background/extract";
import { publicBackgroundAsset } from "@/lib/background/public";
import { repository } from "@/lib/data/store";
import { getOwnerContext } from "@/lib/server/ownership";
import { apiError } from "@/lib/server/api-response";

const textInputSchema = z.object({
  sessionId: z.string().uuid(),
  type: z.enum(["manual", "pasted_text", "linkedin_url"]),
  value: z.string().trim().min(1).max(50_000),
});

function linkedinUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(url.hostname.toLowerCase())) {
    throw new Error("INVALID_LINKEDIN_URL");
  }
  return url.toString();
}

export async function GET(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
    const ownerTokenHash = owner.ownerTokenHash;
    repository.getOwnedSession(ownerTokenHash, sessionId);
    return NextResponse.json({ assets: backgroundStore.list(ownerTokenHash, sessionId).map(publicBackgroundAsset) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const ownerTokenHash = owner.ownerTokenHash;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const sessionId = String(form.get("sessionId") ?? "");
      const file = form.get("file");
      repository.getOwnedSession(ownerTokenHash, sessionId);
      if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "INVALID_DOCUMENT" }, { status: 400 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = detectDocumentType(file.type, bytes);
      if (!type) return NextResponse.json({ error: "UNSUPPORTED_DOCUMENT" }, { status: 415 });
      const asset = backgroundStore.create({
        ownerTokenHash,
        sessionId,
        type,
        name: file.name.slice(0, 200),
        mimeType: file.type,
        byteSize: file.size,
        sourceValue: null,
        extractedText: null,
        rawBytes: bytes,
        status: "processing",
        errorCode: null,
        fields: [],
      });
      try {
        asset.extractedText = (await extractDocumentText(type, bytes)).slice(0, 50_000);
        asset.fields = candidateFields(asset.extractedText);
        asset.status = "ready";
      } catch {
        asset.status = "failed";
        asset.errorCode = "DOCUMENT_PARSE_FAILED";
      }
      await owner.persistence.save();
      return NextResponse.json({ asset: publicBackgroundAsset(asset) }, { status: 201 });
    }

    const input = textInputSchema.parse(await request.json());
    repository.getOwnedSession(ownerTokenHash, input.sessionId);
    const sourceValue = input.type === "linkedin_url" ? linkedinUrl(input.value) : input.value;
    const asset = backgroundStore.create({
      ownerTokenHash,
      sessionId: input.sessionId,
      type: input.type,
      name: input.type === "linkedin_url" ? "LinkedIn profile link" : "Background notes",
      mimeType: null,
      byteSize: new TextEncoder().encode(sourceValue).byteLength,
      sourceValue,
      extractedText: input.type === "linkedin_url" ? null : sourceValue,
      rawBytes: null,
      status: "ready",
      errorCode: null,
      fields: input.type === "linkedin_url" ? [] : candidateFields(sourceValue),
    });
    await owner.persistence.save();
    return NextResponse.json({ asset: publicBackgroundAsset(asset) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LINKEDIN_URL") {
      return NextResponse.json({ error: "INVALID_LINKEDIN_URL" }, { status: 400 });
    }
    return apiError(error);
  }
}
