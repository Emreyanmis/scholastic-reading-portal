# Reading Portal — Scholastic Coding Challenge

A lightweight Teacher Reading Assignment Portal. Teachers assign books to students with a due date and track progress; students open the assigned book in an in-app reader, log minutes read, and update their assignment status.

- **Stack:** Spring Boot 3.3 (Java 21) + React 18 (Vite, TypeScript, Tailwind)
- **Repository:** https://github.com/Emreyanmis/scholastic-reading-portal
- **Live demo:** see [Deployment](#deployment) below
- **Architecture notes:** [`reading-portal/README.md`](./reading-portal/README.md)

## Requirements coverage

Every functional item in the brief maps to a concrete piece of code:

### Teacher
| Requirement | Where |
| ----------- | ----- |
| View available books | `BookController#list` → `CreateAssignmentDialog` book picker |
| Create assignment (book + due date) for student(s) | `AssignmentController#create` (POST `/api/assignments`, accepts multi-student `studentIds[]`) |
| View created assignments, status, and minutes read | `TeacherDashboardPage` + `AssignmentsTable` |
| View assignment status for students | Same table — student name, status badge, minutes read, due/overdue |

### Student
| Requirement | Where |
| ----------- | ----- |
| View assigned reading | `StudentDashboardPage` (only own assignments via `findAllByStudentId…`) |
| Open / view the assigned book | `BookReaderPage` → `BookReader`; full book content via `GET /api/assignments/{id}` |
| Track minutes read | `BookReader` Start/Stop timer + manual minute entry; `POST /api/assignments/{id}/sessions` |
| Update assignment status | `PATCH /api/assignments/{id}/status` — status dropdown on card and inside reader |
| Statuses Not Started / In Progress / Completed | `AssignmentStatus` enum end-to-end |

### Cross-cutting
- **Real authentication:** BCrypt password hashes + HMAC-signed cookie sessions (`SessionService`, `SessionFilter`)
- **Role-gated API:** custom `@AuthUser` argument resolver returns `401` / `403` JSON; teachers can't update student status, students can't list students or create assignments
- **Persistence:** JPA + H2 (file mode locally, in-memory on Render free tier); idempotent `SeedRunner`
- **Validation:** Bean Validation on request DTOs (`@Email`, `@NotBlank`, `@Min`, `@Future` style checks); errors returned as `{ "error": "..." }`
- **Materialized progress:** `Assignment.minutesRead` is bumped in the same transaction as inserting a `ReadingSession` row, so the teacher list query stays O(1) per assignment

## Repository layout

```
scholastic-reading-portal/
├── reading-portal/
│   ├── backend/             Spring Boot API (JPA, H2, REST)
│   │   └── src/main/java/com/scholastic/portal/
│   │       ├── auth/         signed cookie sessions, request filter, @AuthUser
│   │       ├── domain/       User, Book, Assignment, ReadingSession (+ enums)
│   │       ├── repo/         Spring Data JPA repositories
│   │       ├── web/          controllers, DTOs, exception handler
│   │       └── seed/         idempotent demo-data runner
│   ├── frontend/            React SPA (Vite + TS + Tailwind, Scholastic wordmark)
│   ├── render.yaml          Render Blueprint (Docker)
│   └── README.md            Architecture notes
├── DEPLOY.md                Free-tier deploy steps (Render + Vercel)
└── vercel.json              Optional Vercel monorepo config
```

## Quick start (local)

**Prereqs:** JDK 21+, Node 18+ (Maven is bundled via `./mvnw`).

```bash
# Terminal 1 — backend (port 8081 avoids conflicts with Docker on 8080)
cd reading-portal/backend
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081

# Terminal 2 — frontend
cd reading-portal/frontend
npm install
npm run dev                # http://localhost:5173
```

Vite proxies `/api/*` to the backend, so login cookies work without CORS setup in dev.

**Apple Silicon note.** If system `java` crashes with a Rosetta / code-signature error, use the ARM64 JDK that ships under `.tools/` (from the repo root):

```bash
export JAVA_HOME="$(pwd)/.tools/jdk-21.0.7+6/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

### Demo credentials (seeded on every boot)

| Role    | Email              | Password   |
| ------- | ------------------ | ---------- |
| Teacher | teacher@demo.com   | teacher123 |
| Student | alex@demo.com      | student123 |
| Student | jordan@demo.com    | student123 |
| Student | sam@demo.com       | student123 |

Credentials are intentionally **not shown** on the login page — share them out of band.

## Deployment

Free-tier deploy: backend on **Render** (Docker), frontend on **Vercel** (static). Total cost: $0.

| Piece     | Service | Setting                                                |
| --------- | ------- | ------------------------------------------------------ |
| Backend   | Render  | Blueprint path: `reading-portal/render.yaml`           |
| Frontend  | Vercel  | Root: `reading-portal/frontend`, env: `VITE_API_BASE`  |
| CORS link | Render  | `PORTAL_CORS_ORIGINS` = your exact Vercel URL          |

Step-by-step in **[DEPLOY.md](./DEPLOY.md)**.

> Render free tier sleeps after 15 min idle; first request can take ~30s while the JVM cold-starts. H2 is in-memory in prod, so `SeedRunner` repopulates demo data on every cold start. Both behaviours are documented and easy to swap out for production (persistent disk or managed Postgres).

## Key architectural decisions

- **Spring Boot + React, deployed as two services.** Mirrors how a real Scholastic system would be split: API and SPA are independent, can scale independently, and the wire contract is a stable JSON REST surface.
- **Hand-rolled HMAC-signed cookie sessions (`SessionService`).** Real auth — BCrypt password hashes, signed sessions, constant-time signature comparison — without taking on Spring Security's full config burden for a 4-hour exercise. Cookies are `HttpOnly`, `SameSite=Lax` locally / `None+Secure` in prod for cross-site Vercel↔Render.
- **`@AuthUser` argument resolver for authorization.** Controllers declare the required role on the parameter (`@AuthUser(requiredRole = Role.TEACHER, any = false)`), and a single `GlobalExceptionHandler` returns consistent `{ "error": "…" }` JSON. No imperative `if (user.role != …) return 403` scattered around.
- **`open-in-view: false` + `@EntityGraph`.** Disabled the Hibernate OSIV anti-pattern; list queries explicitly fetch the relations the API serializes. Kills N+1 problems and prevents `LazyInitializationException` after the transaction closes.
- **Materialized `minutesRead` + append-only `ReadingSession`.** Each session log atomically increments the totaliser on `Assignment` and writes an audit row. The teacher dashboard renders without an aggregate query; per-day charts and rollbacks are a thin layer on top of the event table.
- **Permissive status state machine.** Logging minutes auto-advances `NOT_STARTED → IN_PROGRESS`, and completing stamps `completedAt`, but students can freely move between states. Real student flows aren't linear (kids reset to "Not Started" when re-reading, etc.).

More detail in [`reading-portal/README.md`](./reading-portal/README.md).

## Assumptions

Things the brief intentionally left open and how I resolved them:

1. **User identity.** Email/password sign-in, no signup flow — accounts are seeded. A real Scholastic deployment would use district SSO (Clever, Google Classroom). Sessions are HMAC-signed cookies, 7-day expiry.
2. **Books are global.** All teachers see the same catalog; no per-teacher / per-school book collection. Books have full inline content (short stories), so the in-app reader actually has something to render.
3. **Assignment uniqueness.** No uniqueness constraint on `(student, book)` — teachers can re-assign the same book deliberately (re-reads, summer review).
4. **Multi-student assignment.** "Create an assignment for student(s)" is interpreted as: one dialog → one book + one due date → N rows inserted, one per selected student.
5. **Minutes are self-reported.** No anti-cheat — log time via Start/Stop timer or manual entry. Logging a session auto-flips `NOT_STARTED → IN_PROGRESS`.
6. **Status transitions are not locked.** A student can move freely between Not Started / In Progress / Completed. Reasoning above.
7. **No "classes" / rosters.** Teachers see *all* students for the demo. Adding `ClassRoom` with many-to-many membership is documented as a next step.
8. **Demo data persistence.** Local: H2 file mode survives restarts. Render free tier: H2 in-memory (no persistent disk on free); `SeedRunner` recreates demo data on cold start. Swappable for managed Postgres without code changes (just the JDBC URL + driver dep).

## API overview

All routes return JSON. Errors come back as `{ "error": "..." }` with appropriate `400` / `401` / `403` / `404`.

| Method | Path                              | Who                   |
| ------ | --------------------------------- | --------------------- |
| POST   | `/api/auth/login`                 | anyone                |
| POST   | `/api/auth/logout`                | anyone                |
| GET    | `/api/auth/me`                    | authed                |
| GET    | `/api/health`                     | anyone (Render probe) |
| GET    | `/api/books`                      | authed                |
| GET    | `/api/students`                   | teacher               |
| GET    | `/api/assignments`                | authed (teacher: created; student: received) |
| POST   | `/api/assignments`                | teacher               |
| GET    | `/api/assignments/{id}`           | owning teacher or student |
| PATCH  | `/api/assignments/{id}/status`    | owning student        |
| POST   | `/api/assignments/{id}/sessions`  | owning student        |

## What I'd improve with more time

1. **Tests.** Backend: `@DataJpaTest` for repos, `@WebMvcTest` for controllers (with a `SessionFilter` test slice), one or two `@SpringBootTest` happy-path flows. Frontend: Vitest for the API/auth wrappers, Playwright for "teacher creates → student logs time → teacher sees updated minutes".
2. **Spring Security / district SSO.** Email/password is right for a demo. For a real deployment swap to Clever / Google Classroom / SAML, keep the cookie shape.
3. **Classes & rosters.** A `ClassRoom` entity with many-to-many membership so teachers only see their own students. Assignments scoped to a class.
4. **Server-side pagination, filtering, sort.** On the teacher view: sort by student name / due / status, filter by status, paginate large rosters.
5. **Per-session reporting.** `ReadingSession` is already an event log; surface a minutes-per-day chart per assignment and class.
6. **Schema migrations.** Replace `ddl-auto: update` with Flyway/Liquibase before anything close to production.
7. **Optimistic UI + toasts.** Status changes and timer saves currently wait for the round trip; small UX win.
8. **CI.** GitHub Actions running `./mvnw verify` and `npm run build && npm test` on every PR.
9. **Audit log / soft delete** on assignments so teachers have a paper trail.
10. **A11y pass.** Focus management on the dialog, screen-reader labels on the timer.

## Deliverables checklist

- [x] **GitHub repository** with clear README — this repo
- [x] **Live deployed URL with credentials** — Vercel (frontend) + Render (backend); demo credentials above
- [x] **Written explanation** — implementation, architectural decisions, tradeoffs, assumptions, future work all covered above and in [`reading-portal/README.md`](./reading-portal/README.md)
