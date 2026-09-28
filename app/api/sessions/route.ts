import { NextResponse } from "next/server";
import { createSessionSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";
import { publicSession } from "@/lib/server/public-data";

export async function POST(request: Request) {
  try {
    const input = createSessionSchema.parse(await request.json());
    const owner = await getOwnerContext(true);
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { session } = repository.createSession({
      ownerTokenHash: owner.ownerTokenHash,
      language: input.language,
      country: input.country ?? null,
      source: input.source,
      acquisition: input.acquisition,
    });
    await owner.persistence.save();
    return NextResponse.json({ session: publicSession(session) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
