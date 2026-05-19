import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiRoute, jsonError } from "@/lib/api";

// One-shot seeding endpoint used to bootstrap the demo data on a fresh
// production database (e.g. after the first Vercel deploy). Protected by a
// shared secret so it can't be hit anonymously.
//
// Usage from a local terminal once the app is deployed:
//   curl -X POST https://<your-app>.vercel.app/api/admin/seed \
//        -H "x-admin-token: $ADMIN_SEED_TOKEN"
//
// Idempotent — does nothing if users already exist, unless ?force=1 is set.

export const dynamic = "force-dynamic";

const BOOKS = [
  { title: "The Lighthouse on Maple Street", author: "A. Quinn", coverColor: "#fde68a", gradeLevel: "Grades 3-5",
    summary: "When the lighthouse on Maple Street goes dark, three friends set out to discover the secret keeping it from shining.",
    content: "Chapter 1 — The Dark Night\n\nThe lighthouse had been dark for seven nights. Mia counted each one from her bedroom window. On the eighth, she packed a flashlight, two granola bars, and her grandfather's old compass, and she went to find out why.\n\nChapter 2 — The Hidden Stairs\n\nBehind the keeper's cottage, half-buried in ivy, was a door Mia had never noticed. It opened to a staircase that smelled like old paper and salt. She took a breath, switched on her flashlight, and started down.\n\nChapter 3 — What the Light Remembers\n\nAt the bottom of the stairs, the lamp from the lighthouse sat on a workbench, its glass cracked. Beside it was a letter, addressed to whoever found it. Mia read it twice, then again. Then she knew exactly what to do." },
  { title: "Migrations", author: "R. Okafor", coverColor: "#bae6fd", gradeLevel: "Grades 6-8",
    summary: "A young naturalist tracks a flock of geese across three countries and learns that home is a direction, not a place.",
    content: "Prologue\n\nEvery autumn, my grandmother said, the geese remember the way home before the people do. I did not understand her then.\n\nPart One — North\n\nWe left in September. The maps were folded into the glove box and the binoculars hung from my neck like a strange necklace…\n\nPart Two — The River Bend\n\nBy October the river had turned silver. The flock landed for three nights and we slept in the truck with the windows cracked open so we could hear them breathing in their sleep." },
  { title: "How Computers Dream", author: "T. Alvarez", coverColor: "#ddd6fe", gradeLevel: "Grades 6-8",
    summary: "A friendly tour through the surprising history of how machines learned to imagine — from punch cards to neural nets.",
    content: "Introduction\n\nBefore computers could dream, they could barely count. This is the story of how we taught them.\n\nChapter 1 — Cards With Holes\n\nIn 1801, a French weaver named Joseph Marie Jacquard built a loom that could read instructions punched into cards. He did not know it, but he had just invented the great-great-grandparent of every program ever written.\n\nChapter 2 — The Imitation Game\n\nA hundred and fifty years later, a mathematician named Alan Turing asked a simple, dangerous question: can machines think? He did not answer it. He gave us a way to keep asking." },
  { title: "The Garden That Wasn't There", author: "S. Park", coverColor: "#bbf7d0", gradeLevel: "Grades 2-4",
    summary: "Ollie plants seeds in an empty lot. Something unexpected grows, and the whole neighborhood notices.",
    content: "Chapter 1\n\nThe lot at the end of Ollie's street was full of broken glass and weeds. Ollie did not mind. He had a packet of sunflower seeds and a plastic shovel, and he had time.\n\nChapter 2\n\nThe first sprouts pushed up after a week of rain. By the end of the month, three neighbors had brought tomato plants. By the end of the summer, the lot had a name." },
  { title: "Atlas of Tiny Kingdoms", author: "P. Liang", coverColor: "#fbcfe8", gradeLevel: "Grades 4-6",
    summary: "An illustrated tour of micro-nations, hidden valleys, and the strange small places that don't make it onto big maps.",
    content: "Foreword\n\nThe biggest maps lie the most. They flatten mountains, hide rivers, and forget about the tiny kingdoms entirely.\n\nEntry 1 — The Republic of the Roof Garden\n\nPopulation: 42 (including the cat). Chief export: tomatoes. Anthem: hummed.\n\nEntry 2 — The Valley Behind the Library\n\nFound only after closing time. No one has ever mapped its eastern edge." },
  { title: "Signals", author: "J. Hart", coverColor: "#fecaca", gradeLevel: "Grades 7-9",
    summary: "A short novel about a radio club in 1989, the static between two cities, and the messages that got through anyway.",
    content: "Chapter 1 — Channel Open\n\nThe radio in Sam's basement was older than Sam was. It hissed like a cat when it warmed up, and on a clear night it could pull in voices from three states away.\n\nChapter 2 — A Voice From Sofia\n\nThe first time he heard her, he thought it was a recording. The second time, she said his call sign back." },
];

export const POST = apiRoute(async (req: NextRequest) => {
  const expected = process.env.ADMIN_SEED_TOKEN;
  if (!expected) return jsonError("Seed endpoint is disabled (set ADMIN_SEED_TOKEN env var)", 503);
  if (req.headers.get("x-admin-token") !== expected) return jsonError("Forbidden", 403);

  const force = new URL(req.url).searchParams.get("force") === "1";
  const existing = await prisma.user.count();
  if (existing > 0 && !force) {
    return NextResponse.json({ skipped: true, reason: `${existing} users already exist; pass ?force=1 to wipe` });
  }

  await prisma.readingSession.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const teacher = await prisma.user.create({
    data: { email: "teacher@demo.com", name: "Ms. Rivera", role: "TEACHER",
            passwordHash: await bcrypt.hash("teacher123", 10) },
  });
  const alex = await prisma.user.create({
    data: { email: "alex@demo.com", name: "Alex Chen", role: "STUDENT",
            passwordHash: await bcrypt.hash("student123", 10) },
  });
  const jordan = await prisma.user.create({
    data: { email: "jordan@demo.com", name: "Jordan Patel", role: "STUDENT",
            passwordHash: await bcrypt.hash("student123", 10) },
  });
  await prisma.user.create({
    data: { email: "sam@demo.com", name: "Sam Williams", role: "STUDENT",
            passwordHash: await bcrypt.hash("student123", 10) },
  });

  for (const b of BOOKS) {
    await prisma.book.create({ data: b });
  }

  const books = await prisma.book.findMany();
  const inDays = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };

  await prisma.assignment.create({
    data: {
      bookId: books[0].id, teacherId: teacher.id, studentId: alex.id,
      dueDate: inDays(7), status: "IN_PROGRESS", minutesRead: 18,
    },
  });
  await prisma.assignment.create({
    data: {
      bookId: books[1].id, teacherId: teacher.id, studentId: jordan.id,
      dueDate: inDays(14),
    },
  });

  return NextResponse.json({
    seeded: true,
    users: await prisma.user.count(),
    books: await prisma.book.count(),
    assignments: await prisma.assignment.count(),
  });
});
