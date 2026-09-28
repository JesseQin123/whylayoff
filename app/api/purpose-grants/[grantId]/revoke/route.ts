import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicGrant } from "@/lib/server/public-data";

type Context = { params: Promise<{ grantId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { grantId } = await params;
    return NextResponse.json({ grant: publicGrant(repository.revokeGrant(hashOwnerToken(ownerToken), grantId)) });
  } catch (error) {
    return apiError(error);
  }
}
