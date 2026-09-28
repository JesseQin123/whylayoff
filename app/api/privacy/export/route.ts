import { NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

const inputSchema = z.object({ sessionId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = inputSchema.parse(await request.json());
    return NextResponse.json(repository.exportParticipantData(hashOwnerToken(ownerToken), sessionId), {
      headers: { "Content-Disposition": "attachment; filename=next-chapter-data.json" },
    });
  } catch (error) {
    return apiError(error);
  }
}
