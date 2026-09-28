import { NextResponse } from "next/server";
import { contactPreferenceInputSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = contactPreferenceInputSchema.parse(await request.json());
    const preferences = repository.setContactPreferences(hashOwnerToken(ownerToken), input.sessionId, input);
    return NextResponse.json({
      preferences: {
        courseInformation: preferences.courseInformation,
        community: preferences.community,
        expertFollowUp: preferences.expertFollowUp,
        version: preferences.version,
        updatedAt: preferences.updatedAt,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
