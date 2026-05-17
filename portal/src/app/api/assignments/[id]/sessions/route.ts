import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiRoute, jsonError } from "@/lib/api";

const Body = z.object({
  minutes: z.number().int().positive().max(600), // sanity cap
});

// Logs a reading session for an assignment. Only the student that owns the
// assignment can log time. Bumps the materialized minutesRead total and, if
// the assignment was Not Started, advances it to In Progress.
export const POST = apiRoute(
  async (req: NextRequest, ctx: { params: { id: string } }) => {
    const user = await requireUser("STUDENT");
    const { minutes } = Body.parse(await req.json());

    const assignment = await prisma.assignment.findUnique({
      where: { id: ctx.params.id },
    });
    if (!assignment) return jsonError("Assignment not found", 404);
    if (assignment.studentId !== user.id) return jsonError("Forbidden", 403);

    const [, updated] = await prisma.$transaction([
      prisma.readingSession.create({
        data: { assignmentId: assignment.id, minutes },
      }),
      prisma.assignment.update({
        where: { id: assignment.id },
        data: {
          minutesRead: { increment: minutes },
          status: assignment.status === "NOT_STARTED" ? "IN_PROGRESS" : assignment.status,
        },
      }),
    ]);

    return NextResponse.json(updated);
  }
);
