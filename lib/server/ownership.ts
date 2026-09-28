import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { hydrateOwnerState } from "@/lib/persistence/owner-state";

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

export async function clearOwnerToken() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getOwnerContext(create = false) {
  const token = create ? await getOrCreateOwnerToken() : await getOwnerToken();
  if (!token) return null;
  const ownerTokenHash = hashOwnerToken(token);
  const persistence = await hydrateOwnerState(ownerTokenHash, create);
  return { token, ownerTokenHash, persistence };
}
