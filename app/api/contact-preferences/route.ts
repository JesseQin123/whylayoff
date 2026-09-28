import { NextResponse } from "next/server";
import { contactPreferenceInputSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";

function publicPreferences(preferences: ReturnType<typeof repository.getContactPreferences>) {
  if (!preferences) return null;
  return {
    emailAddress: preferences.emailAddress,
    serviceEmail: preferences.serviceEmail,
    courseInformation: preferences.courseInformation,
    community: preferences.community,
    expertFollowUp: preferences.expertFollowUp,
    version: preferences.version,
    updatedAt: preferences.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const preferences = repository.getContactPreferences(owner.ownerTokenHash, sessionId);
    return NextResponse.json({ preferences: publicPreferences(preferences) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = contactPreferenceInputSchema.parse(await request.json());
    const preferences = repository.setContactPreferences(owner.ownerTokenHash, input.sessionId, input);
    await owner.persistence.save();
    return NextResponse.json({ preferences: publicPreferences(preferences) });
  } catch (error) {
    return apiError(error);
  }
}
