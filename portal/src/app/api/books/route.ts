import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiRoute } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  await requireUser();
  const books = await prisma.book.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      coverColor: true,
      summary: true,
      gradeLevel: true,
    },
  });
  return NextResponse.json(books);
});
