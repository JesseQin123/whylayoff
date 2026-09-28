import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "next_chapter_owner";

export const hashOwnerToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function getOwnerToken() {
  return (await cookies()).get(COOKIE_NAME)?.value ?? null;
}

export async function getOrCreateOwnerToken() {
  const cookieStore = await cookies();
  const current = cookieStore.get(COOKIE_NAME)?.value;
  if (current) return current;
  const token = randomBytes(32).toString("base64url");
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}
