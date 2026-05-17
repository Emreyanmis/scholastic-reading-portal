import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiRoute, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/assignments
// Teachers: returns assignments they've created.
// Students: returns assignments assigned to them.
export const GET = apiRoute(async () => {
  const user = await requireUser();

  const where =
    user.role === "TEACHER" ? { teacherId: user.id } : { studentId: user.id };

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      book: {
        select: { id: true, title: true, author: true, coverColor: true, summary: true },
      },
      student: { select: { id: true, name: true, email: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(assignments);
});

// POST /api/assignments — teachers only.
// Accepts one or more studentIds; creates an Assignment per student.
const CreateBody = z.object({
  bookId: z.string().min(1, "Pick a book"),
  studentIds: z.array(z.string().min(1)).min(1, "Pick at least one student"),
  dueDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid due date"),
});

export const POST = apiRoute(async (req: NextRequest) => {
  const teacher = await requireUser("TEACHER");
  const { bookId, studentIds, dueDate } = CreateBody.parse(await req.json());

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return jsonError("Book not found", 404);

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: "STUDENT" },
  });
  if (students.length !== studentIds.length) {
    return jsonError("One or more students not found", 404);
  }

  // We don't enforce uniqueness on (student, book) — re-assigning the same book
  // is a legitimate workflow (e.g. a re-read). The teacher dashboard
  // distinguishes duplicates by createdAt + dueDate.
  const created = await prisma.$transaction(
    students.map((s) =>
      prisma.assignment.create({
        data: {
          bookId: book.id,
          teacherId: teacher.id,
          studentId: s.id,
          dueDate: new Date(dueDate),
        },
        include: {
          book: { select: { id: true, title: true } },
          student: { select: { id: true, name: true } },
        },
      })
    )
  );

  return NextResponse.json({ created: created.length, assignments: created });
});
