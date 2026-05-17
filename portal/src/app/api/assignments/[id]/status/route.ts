import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiRoute, jsonError } from "@/lib/api";

const Body = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

export const PATCH = apiRoute(
  async (req: NextRequest, ctx: { params: { id: string } }) => {
    const user = await requireUser("STUDENT");
    const { status } = Body.parse(await req.json());

    const assignment = await prisma.assignment.findUnique({
      where: { id: ctx.params.id },
    });
    if (!assignment) return jsonError("Assignment not found", 404);
    if (assignment.studentId !== user.id) return jsonError("Forbidden", 403);

    const updated = await prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  }
);
