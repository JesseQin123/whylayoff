import { NextResponse } from "next/server";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";
import { publicGrant } from "@/lib/server/public-data";

type Context = { params: Promise<{ grantId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { grantId } = await params;
    const grant = repository.revokeGrant(owner.ownerTokenHash, grantId);
    await owner.persistence.save();
    return NextResponse.json({ grant: publicGrant(grant) });
  } catch (error) {
    return apiError(error);
  }
}
