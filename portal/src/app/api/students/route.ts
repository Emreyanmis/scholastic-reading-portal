import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiRoute } from "@/lib/api";

export const dynamic = "force-dynamic";

// Returns the list of students a teacher can assign to. For this demo the
// roster is global; in a real system it'd be scoped to the teacher's classes.
export const GET = apiRoute(async () => {
  await requireUser("TEACHER");
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(students);
});
