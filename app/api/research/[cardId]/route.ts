import { NextResponse } from "next/server";
import { researchProblemInputSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { researchStore } from "@/lib/research/research-store";
import { publicProblemCard, ResearchService } from "@/lib/research/service";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";

const service = new ResearchService(repository, researchStore);
type Context = { params: Promise<{ cardId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = researchProblemInputSchema.parse(await request.json());
    const { cardId } = await params;
    const card = service.update(owner.ownerTokenHash, input.sessionId, cardId, {
      noProblemObserved: input.noProblemObserved,
      fields: input.fields,
    });
    await owner.persistence.save();
    return NextResponse.json({ card: publicProblemCard(card) });
  } catch (error) {
    return apiError(error);
  }
}
