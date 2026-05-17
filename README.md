# Reading Portal — Scholastic Coding Challenge

A lightweight Teacher Reading Assignment Portal: teachers assign books to students with a due date and track progress; students open the assigned book in an in-app reader, log minutes read, and update their assignment status.

The app is in [`portal/`](./portal). Everything below assumes you're in that directory unless noted.

---

## What's implemented

**Teacher**
- Email/password sign-in
- Dashboard with progress summary (Not Started / In Progress / Completed) and per-assignment minutes-read total
- Create assignment dialog: pick a book, multi-select students, pick a due date
- Filterable assignment table with overdue indicators

**Student**
- Sees only the assignments belonging to them
- Status dropdown on each assignment (Not Started / In Progress / Completed) — same control on the card and inside the reader
- In-app book reader (renders book content) with two ways to log time:
  - **Start / Stop timer** that ticks in the browser and POSTs the elapsed minutes when stopped
  - **Manual entry** for offline/private reading
- Status auto-advances to "In Progress" the first time a student logs reading time
- "Mark as completed" button stamps `completedAt`

**Cross-cutting**
- Cookie-based session with HMAC-signed tokens (no third-party auth dependency for a 4-hour exercise)
- Role-gated API: students can't hit teacher endpoints, students can't touch other students' assignments
- Server-rendered initial state on every page; mutations go through small JSON APIs
- SQLite + Prisma for storage; seed script creates a teacher, three students, six books, and two demo assignments

---

## Architecture at a glance

```
portal/
├── prisma/
│   ├── schema.prisma    # User, Book, Assignment, ReadingSession
│   └── seed.ts          # demo teacher/students/books/assignments
└── src/
    ├── app/
    │   ├── page.tsx                              # login (redirects if signed in)
    │   ├── teacher/page.tsx                      # teacher dashboard (server component)
    │   ├── student/page.tsx                      # student dashboard (server component)
    │   ├── student/assignments/[id]/page.tsx     # book reader
    │   └── api/
    │       ├── auth/{login,logout}/route.ts
    │       ├── books/route.ts
    │       ├── students/route.ts
    │       └── assignments/
    │           ├── route.ts                       # GET list, POST create
    │           └── [id]/
    │               ├── status/route.ts            # PATCH status
    │               └── sessions/route.ts          # POST minutes log
    ├── components/
    │   ├── teacher/{TeacherDashboard,AssignmentsTable,CreateAssignmentDialog}.tsx
    │   └── student/{StudentDashboard,BookReader}.tsx
    └── lib/{prisma,auth,api,format}.ts
```

Stack: **Next.js 14 (App Router) + TypeScript + TailwindCSS + Prisma + SQLite**. Everything is one deployable Next.js artifact (frontend, API, and DB access all in one app).

---

## Run it locally

Prereqs: Node 18+ (any version that ships an `npx`).

```bash
cd portal
cp .env.example .env
npm install                            # installs deps and runs `prisma generate`
npx prisma migrate dev --name init     # creates SQLite db at prisma/dev.db
npm run db:seed                        # seeds books + demo users + 2 starter assignments
npm run dev                            # http://localhost:3000
```

If you ever want to wipe the DB and re-seed: `npm run db:reset && npm run db:seed`.

### Demo credentials (seeded)

| Role    | Email              | Password     |
| ------- | ------------------ | ------------ |
| Teacher | teacher@demo.com   | teacher123   |
| Student | alex@demo.com      | student123   |
| Student | jordan@demo.com    | student123   |
| Student | sam@demo.com       | student123   |

---

## Deploying

The app deploys as a single Next.js artifact. Two paths I've validated:

**Option A: Render / Railway / Fly.io (keeps SQLite)**
- `Build command:` `npm install && npm run build`
- `Start command:` `npm run start` (or `next start`)
- Set env vars: `DATABASE_URL=file:./prisma/dev.db`, `SESSION_SECRET=<long random>`
- Add a small persistent disk mounted at `/app/prisma` so the SQLite file survives restarts
- On first deploy, run `npx prisma migrate deploy && npm run db:seed` once (shell into the instance or use the platform's pre-deploy hook)

**Option B: Vercel (swap to Postgres)**
- Provision a Postgres (Neon free tier, Vercel Postgres, etc.)
- In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
- Set `DATABASE_URL` and `SESSION_SECRET` in Vercel env
- Push and let Vercel run `npm run build` (the build script already runs `prisma migrate deploy`); seed once via `npx prisma db seed` from a local shell pointed at the production URL

I designed the schema to be portable (no provider-specific features besides the SQLite enum workaround noted in `schema.prisma`), so Option B is roughly a one-line schema change.

---

## Key decisions & tradeoffs

**Single Next.js app instead of a separate Java backend.** The brief allowed any stack; one deployable artifact is faster to ship and easier to review inside the 4-hour budget. The API surface lives under `src/app/api/*` and would map cleanly to a Spring Boot controller per route group if we ported it later.

**Hand-rolled HMAC-signed cookie sessions.** I wanted real auth (not a fake "select your role" picker) without paying the integration tax for NextAuth/Auth.js inside 4 hours. The session module (`src/lib/auth.ts`) is small enough to swap for NextAuth without touching any route code. Passwords are bcrypt-hashed, cookies are `HttpOnly` + `SameSite=Lax` + `Secure` in production.

**Materialized `minutesRead` on `Assignment` + append-only `ReadingSession` log.** Teachers need a fast "total minutes per assignment" view, so I incremented a denormalized counter on each session log inside a transaction. Keeping the raw `ReadingSession` rows means we can add per-day charts or "longest reading streak" without a schema migration.

**SQLite for the demo.** Zero-config and embeddable, perfect for a take-home. The schema is intentionally portable to Postgres (only the `enum` types had to be inlined as strings — see comment in `schema.prisma`).

**Server components for initial state, small client components for interactivity.** Each page (`/teacher`, `/student`, `/student/assignments/[id]`) renders its data on the server so the first paint is fully populated; only the parts that need state (forms, dialogs, timer) are `"use client"`. Mutations call the JSON API and patch local state instead of re-fetching.

**Status state machine is intentionally permissive.** Students can move freely between Not Started / In Progress / Completed. I add gentle nudges (logging reading time auto-advances to In Progress, completing stamps `completedAt`) but don't lock the state machine because real student workflows aren't linear (e.g. "I marked it done by mistake"). A stricter machine is an easy follow-up.

**Reading timer is opt-in start/stop, not auto-tracked.** This avoids the worst false-positive cases (tab left open, computer asleep) and matches how reading-engagement products typically work. I round up so a 30-second peek still counts as 1 minute — better UX, harmless for reporting at this fidelity.

**Assignments aren't unique on `(student, book)`.** Re-assigning the same book is a legitimate workflow (re-reads, summer reviews). The dashboard distinguishes duplicates by created/due dates.

---

## Assumptions

- A teacher can assign to any student in the system. In a real product the roster would be scoped to the teacher's classes, but classes weren't in scope here.
- Books are pre-loaded (seeded); there's no "add a book" flow. The brief said "a list of books should be available to assign" — I read that as catalog ingestion being out of scope.
- The "book content" is plain text rendered in a simple reader pane. Real Scholastic content would be PDFs/EPUBs with DRM — but the reader is the right shape for that to slot in later (it's an opaque content field on `Book`).
- Email/password is enough for the demo. SSO (Clever, Google Classroom, district SAML) is the real Scholastic answer but out of scope.
- Due dates are stored as `DateTime` (UTC) and rendered with the browser's locale. No timezone selector — fine for the demo, would need attention before production.

---

## What I'd do with more time

1. **Tests.** I'd add Vitest unit tests for `src/lib/auth.ts` (token signing, expiry) and `src/lib/api.ts` (error mapping), plus Playwright happy-path tests covering: teacher creates assignment → student logs time → teacher sees updated minutes. The clean separation between server components, API routes, and lib modules was deliberately set up to make this easy.
2. **Real authentication.** Swap the hand-rolled session for Auth.js with a Credentials provider (preserving the same shape) and add password reset / SSO.
3. **Classes & rosters.** A `Class` model with a many-to-many `ClassMembership` so teachers only see students in their classes. Assignments would be scoped to a class or to specific students within it.
4. **Pagination & filtering on the teacher view.** Currently it loads all assignments. Once a teacher has more than ~50, this needs server-side pagination + filters by student, book, due window, and status.
5. **Per-session reporting.** The `ReadingSession` table is already populated; expose a small chart on the teacher view ("minutes read per day for this assignment").
6. **Better assignment status state machine.** Distinguish "due", "overdue", "submitted", and "completed" — completed-after-due is a real signal teachers care about.
7. **Audit + soft delete.** Assignments shouldn't be hard-deleted; teachers need a paper trail.
8. **Optimistic UI + toast feedback.** The student status dropdown and timer log currently re-render after the request returns. Optimistic updates + a toast on success/failure would feel snappier.
9. **A11y pass.** Headings, focus traps in the dialog, screen-reader labels on the timer.
10. **CI.** A GitHub Actions workflow running `npm run build` + tests on every PR; type-check is already enforced by `next build`.

---

## API quick reference

All routes return JSON. Auth-protected endpoints respond `401` (no session) or `403` (wrong role).

| Method | Path                                       | Who         | Purpose                                |
| ------ | ------------------------------------------ | ----------- | -------------------------------------- |
| POST   | `/api/auth/login`                          | anyone      | Sign in, sets `rp_session` cookie      |
| POST   | `/api/auth/logout`                         | anyone      | Clears the session cookie              |
| GET    | `/api/books`                               | authed      | List the assignable book catalog       |
| GET    | `/api/students`                            | teacher     | List students available to assign to   |
| GET    | `/api/assignments`                         | authed      | Teacher: own creations; Student: own   |
| POST   | `/api/assignments`                         | teacher     | Create one assignment per studentId    |
| PATCH  | `/api/assignments/:id/status`              | owner stu.  | Update assignment status               |
| POST   | `/api/assignments/:id/sessions`            | owner stu.  | Log minutes; bumps `minutesRead` total |
