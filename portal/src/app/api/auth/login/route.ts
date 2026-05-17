import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { apiRoute, jsonError } from "@/lib/api";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = apiRoute(async (req: NextRequest) => {
  const { email, password } = Body.parse(await req.json());

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return jsonError("Invalid email or password", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return jsonError("Invalid email or password", 401);

  setSessionCookie(createSessionToken(user.id));
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});
