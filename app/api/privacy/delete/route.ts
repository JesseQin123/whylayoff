import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { privacyService } from "@/lib/privacy/store";

const inputSchema = z.object({ sessionId: z.string().uuid(), confirmation: z.literal("DELETE") });

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
