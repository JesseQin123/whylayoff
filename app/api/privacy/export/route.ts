import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { researchStore } from "@/lib/research/research-store";
import { publicProblemCard } from "@/lib/research/service";
import { benefitStore } from "@/lib/benefits/benefit-store";
import { publicBenefitClaim } from "@/lib/benefits/service";

const inputSchema = z.object({ sessionId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = inputSchema.parse(await request.json());
    const ownerTokenHash = hashOwnerToken(ownerToken);
    const exported = repository.exportParticipantData(ownerTokenHash, sessionId);
    const researchProblemCards = researchStore.listByOwner(ownerTokenHash, sessionId).map(publicProblemCard);
    const benefitActivity = benefitStore.listByOwner(ownerTokenHash, sessionId).map(publicBenefitClaim);
    return NextResponse.json({ ...exported, researchProblemCards, benefitActivity }, {
      headers: { "Content-Disposition": "attachment; filename=next-chapter-data.json" },
    });
  } catch (error) {
    return apiError(error);
  }
}
