import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentDashboard } from "@/components/student/StudentDashboard";

export const dynamic = "force-dynamic";

export default async function StudentHome() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "STUDENT") redirect("/teacher");

  const assignments = await prisma.assignment.findMany({
    where: { studentId: user.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      book: { select: { id: true, title: true, author: true, coverColor: true, summary: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return <StudentDashboard initialAssignments={JSON.parse(JSON.stringify(assignments))} />;
}
