import { NextResponse } from "next/server";
import { interviewAnswerSchema } from "@/lib/domain";
import { repository } from "@/lib/data/store";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";
import { publicFact } from "@/lib/server/public-data";
import { processInterviewAnswer } from "@/lib/interview/service";

type Context = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = interviewAnswerSchema.parse(await request.json());
    const { sessionId } = await params;
    const receipt = await processInterviewAnswer(repository, owner.ownerTokenHash, sessionId, input);
    await owner.persistence.save();
    return NextResponse.json({ ...receipt, facts: receipt.facts.map(publicFact) });
  } catch (error) {
    return apiError(error);
  }
}
