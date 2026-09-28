import { NextResponse } from "next/server";
import { purposeGrantInputSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";
import { publicGrant } from "@/lib/server/public-data";

export async function POST(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = purposeGrantInputSchema.parse(await request.json());
    const grant = repository.setPurposeForOwnedSession(
      owner.ownerTokenHash,
      input.sessionId,
      input.purpose,
      input.selected,
      input.noticeVersion,
    );
    await owner.persistence.save();
    return NextResponse.json({ grant: publicGrant(grant) });
  } catch (error) {
    return apiError(error);
  }
}
