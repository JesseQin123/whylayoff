import { NextResponse } from "next/server";
import { researchProblemInputSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { researchStore } from "@/lib/research/research-store";
import { publicProblemCard, ResearchService } from "@/lib/research/service";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

const service = new ResearchService(repository, researchStore);

export async function GET(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const cards = service.list(hashOwnerToken(ownerToken), sessionId).map(publicProblemCard);
    return NextResponse.json({ cards });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = researchProblemInputSchema.parse(await request.json());
    const card = service.create(hashOwnerToken(ownerToken), input.sessionId, {
      noProblemObserved: input.noProblemObserved,
      fields: input.fields,
    });
    return NextResponse.json({ card: publicProblemCard(card) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
