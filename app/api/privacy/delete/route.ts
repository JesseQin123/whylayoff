import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { backgroundStore } from "@/lib/background/background-store";

const inputSchema = z.object({ sessionId: z.string().uuid(), confirmation: z.literal("DELETE") });

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = inputSchema.parse(await request.json());
    const ownerTokenHash = hashOwnerToken(ownerToken);
    const result = repository.deleteParticipantData(ownerTokenHash, sessionId);
    backgroundStore.deleteForOwner(ownerTokenHash);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
