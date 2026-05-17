import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookReader } from "@/components/student/BookReader";

export const dynamic = "force-dynamic";

export default async function AssignmentDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "STUDENT") redirect("/teacher");

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: { book: true, teacher: { select: { name: true } } },
  });
  if (!assignment) notFound();
  if (assignment.studentId !== user.id) {
    // Don't leak existence — show not-found rather than 403.
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link href="/student" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← Back to my reading
      </Link>
      <BookReader
        assignment={{
          id: assignment.id,
          status: assignment.status,
          minutesRead: assignment.minutesRead,
          dueDate: assignment.dueDate.toISOString(),
          completedAt: assignment.completedAt?.toISOString() ?? null,
        }}
        book={{
          title: assignment.book.title,
          author: assignment.book.author,
          summary: assignment.book.summary,
          coverColor: assignment.book.coverColor,
          content: assignment.book.content,
        }}
        teacherName={assignment.teacher.name}
      />
    </div>
  );
}
