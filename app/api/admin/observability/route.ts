import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { operationStore } from "@/lib/observability/operation-store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";

export async function GET(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const ownerTokenHash = owner.ownerTokenHash;
    repository.getOwnedSession(ownerTokenHash, sessionId);
    return NextResponse.json(operationStore.summary(ownerTokenHash));
  } catch (error) {
    return apiError(error);
  }
}
