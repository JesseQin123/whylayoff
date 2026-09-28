import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DataAccessError } from "@/lib/data/local-repository";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "INVALID_REQUEST", details: error.issues }, { status: 400 });
  }
  if (error instanceof DataAccessError) {
    const status = error.code === "CONFLICT" ? 409 : error.code === "FORBIDDEN" ? 403 : error.code === "DELETED" ? 410 : 404;
    return NextResponse.json({ error: error.code, message: error.message }, { status });
  }
  console.error("Unhandled API error", error);
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}
