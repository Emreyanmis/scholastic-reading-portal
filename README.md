# Reading Portal — Scholastic Coding Challenge

A lightweight Teacher Reading Assignment Portal: teachers assign books to students with a due date and track progress; students open the assigned book in an in-app reader, log minutes read, and update their assignment status.

I shipped **two implementations** that share the same data model, the same API contract, and (very nearly) the same UI. Pick whichever you want to review first — the design decisions and behaviour are intentionally the same.

| Variant | Path | Stack | Best for |
| ------- | ---- | ----- | -------- |
| **Next.js full-stack** | [`portal/`](./portal) | Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + SQLite | Single deployable artifact, fastest path to a demo |
| **Spring Boot + React** | [`portal-java/`](./portal-java) | Spring Boot 3.3 + JPA + H2 (backend) · Vite + React + TS + Tailwind (frontend) | Matches Scholastic's stated stack (Java backend + React frontend), two-service deployment |

Each variant has its own README with setup, decisions, tradeoffs, and what I'd improve with more time.

## Why two?

The brief reads:

> You may use any language or framework. We primarily work in Java (backend) and React (frontend), so feel free to use those if comfortable — **but this is not required.**

I built the **Next.js variant first** because it lets a single artifact cover frontend, API, and data layer — that's a faster path to a working demo within a 4-hour budget, and the architecture choice is itself a defensible interview talking point.

I then built the **Spring Boot + React variant** so there's a version that maps cleanly to how Scholastic actually works day-to-day. The schema, the API surface, the auth approach, and the UI are deliberately the same — what changes is the implementation language and the deployment topology.

## What's implemented (identical in both variants)

**Teacher**
- Email/password sign-in
- Dashboard with progress summary (Not Started / In Progress / Completed) and per-assignment minutes-read totals
- Create-assignment dialog: pick a book, multi-select students, pick a due date
- Filterable assignment table with overdue indicators

**Student**
- Sees only the assignments belonging to them
- Status dropdown on each assignment — same control on the card and inside the reader
- In-app book reader with two ways to log time:
  - **Start / Stop timer** that ticks in the browser and POSTs the elapsed minutes when stopped
  - **Manual entry** for offline reading
- Status auto-advances to "In Progress" the first time a student logs reading time
- "Mark as completed" button stamps `completedAt`

**Cross-cutting**
- Real email/password auth (BCrypt passwords + HMAC-signed cookie sessions)
- Role-gated API: students can't hit teacher endpoints, students can't touch other students' assignments
- Materialized `minutesRead` on `Assignment` + append-only `ReadingSession` log for future per-session reporting
- Seed runner that creates one teacher, three students, six books, and two starter assignments

## Quick start

### Next.js variant

```bash
cd portal
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev                # http://localhost:3000
```

### Spring Boot + React variant

```bash
# Terminal 1 — backend
cd portal-java/backend
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081

# Terminal 2 — frontend
cd portal-java/frontend
npm install
npm run dev                # http://localhost:5173
```

Both variants ship with the same demo accounts: `teacher@demo.com / teacher123`, `alex@demo.com / student123`, `jordan@demo.com / student123`, `sam@demo.com / student123`.

## Deliverables

- **GitHub repository.** This repo. A clean initial commit per variant plus the merge into a single repo.
- **Live deployed URL with credentials.** See per-variant READMEs for deployment paths (Next.js → Vercel/Render; Spring Boot + React → Render/Fly.io + Vercel/Netlify).
- **Written explanation.** Each variant's README covers what's implemented, key architectural decisions, tradeoffs/assumptions, and what I'd improve with more time.

## API parity at a glance

Both backends expose the same routes with the same wire format, so the same frontend code shape works either way:

| Method | Path                                       | Who              |
| ------ | ------------------------------------------ | ---------------- |
| POST   | `/api/auth/login`                          | anyone           |
| POST   | `/api/auth/logout`                         | anyone           |
| GET    | `/api/auth/me`                             | authed           |
| GET    | `/api/books`                               | authed           |
| GET    | `/api/students`                            | teacher          |
| GET    | `/api/assignments`                         | authed           |
| POST   | `/api/assignments`                         | teacher          |
| GET    | `/api/assignments/{id}`                    | owner stu/teach. |
| PATCH  | `/api/assignments/{id}/status`             | owner student    |
| POST   | `/api/assignments/{id}/sessions`           | owner student    |

Errors come back as `{ "error": "..." }` with appropriate `401`/`403`/`400`/`404` status codes from both.
