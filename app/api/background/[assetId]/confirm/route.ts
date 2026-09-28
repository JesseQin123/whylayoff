import { NextResponse } from "next/server";
import { backgroundConfirmSchema } from "@/lib/domain";
import { backgroundStore } from "@/lib/background/background-store";
import { publicBackgroundAsset } from "@/lib/background/extract";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";
import { publicFact, publicSession } from "@/lib/server/public-data";

type Context = { params: Promise<{ assetId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const token = await getOwnerToken();
    if (!token) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const ownerTokenHash = hashOwnerToken(token);
    const input = backgroundConfirmSchema.parse(await request.json());
    const { assetId } = await params;
    const asset = backgroundStore.get(ownerTokenHash, assetId);
    if (asset.sessionId !== input.sessionId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const result = repository.confirmBackgroundFields(
      ownerTokenHash,
      input.sessionId,
      input.expectedStateVersion,
      input.fields,
    );
    backgroundStore.confirm(ownerTokenHash, assetId, input.fields.map((field) => ({ ...field })));
    return NextResponse.json({
      asset: publicBackgroundAsset(asset),
      session: publicSession(result.session),
      facts: result.facts.map(publicFact),
    });
  } catch (error) {
    return apiError(error);
  }
}
