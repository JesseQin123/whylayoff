import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";
import { publicEvidenceClaim, publicFact, publicGrant, publicSession } from "@/lib/server/public-data";

type Context = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = await params;
    const snapshot = repository.getSessionSnapshot(owner.ownerTokenHash, sessionId);
    return NextResponse.json({
      session: publicSession(snapshot.session),
      grants: snapshot.grants.map(publicGrant),
      facts: snapshot.facts.map(publicFact),
      evidenceClaims: snapshot.evidenceClaims.map(publicEvidenceClaim),
    });
  } catch (error) {
    return apiError(error);
  }
}
