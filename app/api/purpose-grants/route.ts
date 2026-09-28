import { NextResponse } from "next/server";
import { purposeGrantInputSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicGrant } from "@/lib/server/public-data";

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = purposeGrantInputSchema.parse(await request.json());
    const grant = repository.setPurposeForOwnedSession(
      hashOwnerToken(ownerToken),
      input.sessionId,
      input.purpose,
      input.selected,
      input.noticeVersion,
    );
    return NextResponse.json({ grant: publicGrant(grant) });
  } catch (error) {
    return apiError(error);
  }
}
