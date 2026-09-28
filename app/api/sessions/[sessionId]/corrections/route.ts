import { NextResponse } from "next/server";
import { correctionSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { processCorrection } from "@/lib/interview/service";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicFact } from "@/lib/server/public-data";

type Context = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = correctionSchema.parse(await request.json());
    const { sessionId } = await params;
    const receipt = await processCorrection(repository, hashOwnerToken(ownerToken), sessionId, input);
    return NextResponse.json({ ...receipt, facts: receipt.facts.map(publicFact) });
  } catch (error) {
    return apiError(error);
  }
}
