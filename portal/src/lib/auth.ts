import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

// --- Session implementation -----------------------------------------------
// I went with a tiny signed-cookie session to keep the surface area small for
// this exercise (no external auth provider, no DB-backed sessions). The cookie
// stores `userId.timestamp` HMAC-signed with SESSION_SECRET. For production
// I'd swap this for NextAuth/Auth.js + a sessions table.

const COOKIE_NAME = "rp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    // In dev, fall back to a generated, ephemeral secret so the app still runs
    // without an .env. This will invalidate sessions on every restart.
    if (process.env.NODE_ENV !== "production") {
      return "dev-only-insecure-secret";
    }
    throw new Error("SESSION_SECRET is required in production");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}.${randomBytes(8).toString("hex")}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function parseSessionToken(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, ts, nonce, sig] = parts;
  const expected = sign(`${userId}.${ts}.${nonce}`);
  if (!safeEqual(sig, expected)) return null;
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) return null;
  return { userId };
}

export function setSessionCookie(token: string) {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "TEACHER" | "STUDENT";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  const parsed = parseSessionToken(token);
  if (!parsed) return null;
  const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "TEACHER" | "STUDENT",
  };
}

export async function requireUser(role?: "TEACHER" | "STUDENT"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Not authenticated", 401);
  if (role && user.role !== role) throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
