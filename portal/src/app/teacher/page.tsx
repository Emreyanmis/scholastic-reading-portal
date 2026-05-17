import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";

export const dynamic = "force-dynamic";

export default async function TeacherHome() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "TEACHER") redirect("/student");

  // Server-render initial state so the dashboard isn't blank on first paint.
  const [assignments, books, students] = await Promise.all([
    prisma.assignment.findMany({
      where: { teacherId: user.id },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        book: { select: { id: true, title: true, author: true, coverColor: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.book.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, author: true, coverColor: true, summary: true, gradeLevel: true },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TeacherDashboard
      initialAssignments={JSON.parse(JSON.stringify(assignments))}
      books={books}
      students={students}
    />
  );
}
