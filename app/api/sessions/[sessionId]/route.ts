import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicFact, publicGrant, publicSession } from "@/lib/server/public-data";

type Context = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = await params;
    const snapshot = repository.getSessionSnapshot(hashOwnerToken(ownerToken), sessionId);
    return NextResponse.json({
      session: publicSession(snapshot.session),
      grants: snapshot.grants.map(publicGrant),
      facts: snapshot.facts.map(publicFact),
    });
  } catch (error) {
    return apiError(error);
  }
}
