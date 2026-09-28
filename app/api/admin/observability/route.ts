import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { operationStore } from "@/lib/observability/operation-store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

export async function GET(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    repository.getOwnedSession(hashOwnerToken(ownerToken), sessionId);
    return NextResponse.json(operationStore.summary());
  } catch (error) {
    return apiError(error);
  }
}
