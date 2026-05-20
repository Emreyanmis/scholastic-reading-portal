# Reading Portal — Spring Boot + React

A Teacher Reading Assignment Portal: teachers assign books to students with a due date and track progress; students open the assigned book in an in-app reader, log minutes read, and update their assignment status.

This is the Spring Boot + React variant of the project. Architecturally it's two services that share the same data model and API contract as the single-app Next.js version in `../portal/`.

## Layout

```
reading-portal/
├── backend/        Spring Boot 3.3 + Spring Data JPA + H2 (file)
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd, .mvn/wrapper/   (Maven wrapper — no Maven needed)
│   └── src/main/java/com/scholastic/portal/
│       ├── PortalApplication.java
│       ├── auth/        (HMAC-signed cookie sessions, request filter, role gate)
│       ├── config/      (CORS + arg resolver registration)
│       ├── domain/      (User, Book, Assignment, ReadingSession, enums)
│       ├── repo/        (Spring Data JPA repositories)
│       ├── web/         (controllers, DTOs, exception handler)
│       └── seed/        (CommandLineRunner that inserts demo data once)
└── frontend/       Vite + React 18 + TS + Tailwind
    └── src/
        ├── lib/         (api client, auth context, formatters)
        ├── pages/       (LoginPage, TeacherDashboardPage, StudentDashboardPage, BookReaderPage)
        └── components/  (Header, AssignmentsTable, CreateAssignmentDialog, BookReader)
```

## Run it locally

Prereqs: **JDK 21+** for the backend, **Node 18+** for the frontend. Maven is bundled via the wrapper.

### 1. Backend

```bash
cd backend
./mvnw spring-boot:run
# Default port: 8080. If you have Docker/anything else on 8080, override:
#   ./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

First run creates `./data/portal.mv.db` (H2 file mode) and a `SeedRunner` inserts demo books + users. On subsequent boots it sees the DB is populated and does nothing.

### 2. Frontend (new terminal)

```bash
cd frontend
cp .env.example .env       # only needed if your backend isn't on http://localhost:8081
npm install
npm run dev                # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend so the browser sees a single origin (matters for cookie auth). The proxy target defaults to `http://localhost:8081`; override with `VITE_DEV_BACKEND` if you ran the backend on a different port.

### Demo credentials (seeded automatically)

| Role    | Email              | Password     |
| ------- | ------------------ | ------------ |
| Teacher | teacher@demo.com   | teacher123   |
| Student | alex@demo.com      | student123   |
| Student | jordan@demo.com    | student123   |
| Student | sam@demo.com       | student123   |

## API surface

All routes return JSON. Errors come back as `{ "error": "..." }`. Auth-protected endpoints answer `401` (no session) or `403` (wrong role).

| Method | Path                                      | Who              | Purpose                                |
| ------ | ----------------------------------------- | ---------------- | -------------------------------------- |
| POST   | `/api/auth/login`                         | anyone           | Sign in, sets `rp_session` cookie      |
| POST   | `/api/auth/logout`                        | anyone           | Clears the session cookie              |
| GET    | `/api/auth/me`                            | authed           | Current user (used to rehydrate SPA)   |
| GET    | `/api/books`                              | authed           | Book catalog                           |
| GET    | `/api/students`                           | teacher          | Students available to assign to        |
| GET    | `/api/assignments`                        | authed           | Teacher: created; Student: received    |
| POST   | `/api/assignments`                        | teacher          | Create one per student in `studentIds` |
| GET    | `/api/assignments/{id}`                   | owner stu/teach. | Detail with full book content (reader) |
| PATCH  | `/api/assignments/{id}/status`            | owner student    | Update assignment status               |
| POST   | `/api/assignments/{id}/sessions`          | owner student    | Log minutes; bumps `minutesRead`       |

The wire format is identical to the Next.js version's API, so the same React UI works against either backend.

## Key decisions

**Two services, one API contract.** The Spring Boot service is the system of record; React is a client that talks to it. Each can be deployed independently. The wire format matches the Next.js version exactly so we can swap backends without touching the frontend.

**Hand-rolled HMAC-signed cookie sessions in `auth/SessionService.java`.** I wanted real auth (BCrypt-hashed passwords, signed sessions) without taking on Spring Security's configuration cost for a 4-hour exercise. The class is ~70 lines and uses `MessageDigest.isEqual` for constant-time comparison. Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production. To migrate to Spring Security later: keep the cookie shape, swap `SessionService.verify` for a `SecurityFilterChain` + `RememberMeServices` and remove the filter.

**Authorization on the controller via `@AuthUser`.** A small custom `HandlerMethodArgumentResolver` injects a `CurrentUser` and (optionally) enforces a required role at parameter-binding time, throwing 401/403 with consistent JSON via `GlobalExceptionHandler`. Reads cleanly:

```java
@PostMapping
public Response create(@AuthUser(requiredRole = Role.TEACHER, any = false) CurrentUser teacher, ...) { }
```

**`open-in-view: false` + explicit `@EntityGraph` joins.** I disabled OSIV (which is the right default for any service) and made the list queries eagerly fetch the relations the API serializes. This kills N+1 problems before they happen and means LazyInitializationException can't bite a controller after the transaction closes. Writes are wrapped in `@Transactional` so the materialized `minutesRead` increment and `ReadingSession` insert commit atomically.

**Materialized `minutesRead` + append-only `ReadingSession`.** Each session log increments `Assignment.minutesRead` inside the same transaction as inserting a session row. Teachers get a fast "total minutes per assignment" view; the raw event log is preserved so we can add per-day charts later without a schema change.

**H2 file mode for the demo.** Zero-config and survives restarts. Schema is portable to PostgreSQL: change `spring.datasource.url`/`driver-class-name`, set `spring.jpa.properties.hibernate.dialect`, and add the Postgres driver dependency. The seed runner is idempotent so it does nothing if the table already has rows.

**Status state machine is intentionally permissive.** Students can move freely between Not Started / In Progress / Completed. We nudge — logging minutes auto-advances Not Started → In Progress, completing stamps `completedAt` — but don't lock the state machine because real student flows aren't linear.

**Vite dev proxy.** In development the React app calls `/api/*` and Vite proxies to the Spring Boot port, so the browser sees one origin and cookies don't have to navigate cross-origin CORS. In production you set `VITE_API_BASE` and the backend's `PORTAL_CORS_ORIGINS` to allow the frontend's origin with credentials.

## Configuration

Env vars (all optional in dev, all important in prod):

| Variable                  | Default                                                  | Notes |
| ------------------------- | -------------------------------------------------------- | ----- |
| `PORTAL_SESSION_SECRET`   | `dev-only-insecure-secret`                               | **Required** in prod. Long random string. |
| `PORTAL_CORS_ORIGINS`     | `http://localhost:5173,http://localhost:4173`            | Comma-separated origins allowed to send cookies. |
| `SERVER_PORT`             | 8080                                                     | Spring Boot HTTP port. |
| `SPRING_DATASOURCE_URL`   | `jdbc:h2:file:./data/portal;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1` | Override for Postgres. |
| `VITE_API_BASE` (frontend prod)  | empty (relative URLs)                              | Set to the deployed backend URL. |
| `VITE_DEV_BACKEND` (frontend dev) | `http://localhost:8081`                           | What the Vite proxy targets. |

## Deploy

Two-service deployment is the natural fit:

- **Backend (Render / Railway / Fly.io / a JAR on any VM).**
  - Build: `./mvnw -DskipTests package` → `target/portal-backend-0.1.0.jar`
  - Run: `java -jar portal-backend-0.1.0.jar` with env vars above
  - Add a small persistent disk mounted at the working dir so `./data/portal.mv.db` survives, or move to managed Postgres for production
- **Frontend (Vercel / Netlify / Cloudflare Pages / any static host).**
  - Build: `npm install && npm run build` → `dist/`
  - Set `VITE_API_BASE` to the backend URL at build time
  - Make sure the backend's `PORTAL_CORS_ORIGINS` includes the frontend origin

For a single-origin deployment, serve the built `dist/` from any reverse proxy (nginx, Caddy) in front of the Spring Boot service and skip CORS altogether — that's the path I'd take for an internal Scholastic env.

## What I'd do with more time

1. **Tests.** Backend: `@DataJpaTest` for repositories, `@WebMvcTest` for controllers (mocking `SessionFilter`), and a couple of `@SpringBootTest` happy-path tests. Frontend: Vitest for the api wrapper + auth context, Playwright for "teacher creates → student logs time → teacher sees updated minutes".
2. **Spring Security + Auth.js / Clever / Google Classroom SSO.** Email/password is enough for the demo; a real Scholastic deployment needs district SSO.
3. **Classes & rosters.** A `ClassRoom` entity with many-to-many membership so teachers only see their students. Assignments scoped to a class.
4. **Server-side pagination + filtering** on the teacher view; sorts on student name, due date, status.
5. **Per-session reporting** — there's already a `ReadingSession` table; expose a small chart of minutes-per-day per assignment.
6. **Flyway / Liquibase migrations** instead of `ddl-auto: update` (fine for a demo, dangerous in production).
7. **Optimistic UI + toasts** on the React side; status changes and timer logs currently re-render after the request returns.
8. **CI** — GitHub Actions running `./mvnw verify` for backend and `npm run build && npm test` for frontend on every PR.
9. **Audit log / soft delete** on assignments so teachers have a paper trail.
10. **A11y pass** — focus management on the dialog, screen-reader labels on the timer.
