import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api-response";
import { getOwnerContext } from "@/lib/server/ownership";
import { privacyService } from "@/lib/privacy/store";

const inputSchema = z.object({ sessionId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const owner = await getOwnerContext();
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const { sessionId } = inputSchema.parse(await request.json());
    const ownerTokenHash = owner.ownerTokenHash;
    return NextResponse.json(privacyService.exportData(ownerTokenHash, sessionId), {
      headers: { "Content-Disposition": "attachment; filename=next-chapter-data.json" },
    });
  } catch (error) {
    return apiError(error);
  }
}
