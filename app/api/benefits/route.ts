import { NextResponse } from "next/server";
import { benefitActionSchema } from "@/lib/domain";
import { publicBenefitCatalog } from "@/lib/benefits/catalog";
import { benefitStore } from "@/lib/benefits/benefit-store";
import { BenefitsService, publicBenefitClaim } from "@/lib/benefits/service";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerToken, hashOwnerToken } from "@/lib/server/ownership";

const service = new BenefitsService(repository, benefitStore);

export async function GET(request: Request) {
  const catalog = publicBenefitCatalog();
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const ownerToken = await getOwnerToken();
  if (!sessionId || !ownerToken) return NextResponse.json({ catalog, claims: [] });
  try {
    const claims = service.list(hashOwnerToken(ownerToken), sessionId).map(publicBenefitClaim);
    return NextResponse.json({ catalog, claims });
  } catch {
    return NextResponse.json({ catalog, claims: [] });
  }
}

export async function POST(request: Request) {
  try {
    const ownerToken = await getOwnerToken();
    if (!ownerToken) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = benefitActionSchema.parse(await request.json());
    const claim = service.record(hashOwnerToken(ownerToken), input.sessionId, input.offerId, input.action);
    return NextResponse.json({ claim: publicBenefitClaim(claim) });
  } catch (error) {
    return apiError(error);
  }
}
