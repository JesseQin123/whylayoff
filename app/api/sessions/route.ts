import { NextResponse } from "next/server";
import { createSessionSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOrCreateOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicSession } from "@/lib/server/public-data";

export async function POST(request: Request) {
  try {
    const input = createSessionSchema.parse(await request.json());
    const ownerToken = await getOrCreateOwnerToken();
    const { session } = repository.createSession({
      ownerTokenHash: hashOwnerToken(ownerToken),
      language: input.language,
      country: input.country ?? null,
      source: input.source,
    });
    return NextResponse.json({ session: publicSession(session) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
