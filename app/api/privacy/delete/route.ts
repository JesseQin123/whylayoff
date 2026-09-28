import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { backgroundStore } from "@/lib/background/background-store";
import { resumeStore } from "@/lib/outputs/resume-store";
import { researchStore } from "@/lib/research/research-store";
import { benefitStore } from "@/lib/benefits/benefit-store";
import { PrivacyService } from "@/lib/privacy/privacy-service";

const inputSchema = z.object({ sessionId: z.string().uuid(), confirmation: z.literal("DELETE") });
const privacyService = new PrivacyService(repository, backgroundStore, resumeStore, researchStore, benefitStore);

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = inputSchema.parse(await request.json());
    const ownerTokenHash = hashOwnerToken(ownerToken);
    return NextResponse.json(privacyService.deleteData(ownerTokenHash, sessionId));
  } catch (error) {
    return apiError(error);
  }
}
