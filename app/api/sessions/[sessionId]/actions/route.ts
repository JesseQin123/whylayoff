import { NextResponse } from "next/server";
import { sessionActionSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { processSessionAction } from "@/lib/interview/service";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicFact, publicSession } from "@/lib/server/public-data";

type Context = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = sessionActionSchema.parse(await request.json());
    const { sessionId } = await params;
    const result = await processSessionAction(repository, hashOwnerToken(ownerToken), sessionId, input);
    return NextResponse.json({
      session: publicSession(result.session),
      receipt: result.receipt ? { ...result.receipt, facts: result.receipt.facts.map(publicFact) } : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
