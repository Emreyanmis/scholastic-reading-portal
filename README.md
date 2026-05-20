# Reading Portal — Scholastic Coding Challenge

A lightweight Teacher Reading Assignment Portal: teachers assign books to students with a due date and track progress; students open the assigned book in an in-app reader, log minutes read, and update their assignment status.

**Stack:** Spring Boot 3.3 (Java 21) backend + React 18 (Vite, TypeScript, Tailwind) frontend.

**Repository:** https://github.com/Emreyanmis/scholastic-reading-portal

## Repository layout

```
scholastic-reading-portal/
├── reading-portal/
│   ├── backend/            Spring Boot API (JPA, H2, REST)
│   ├── frontend/           React SPA (Scholastic wordmark)
│   ├── render.yaml         Render Blueprint (backend)
│   └── README.md           Architecture notes & API reference
├── DEPLOY.md               Free-tier deploy (Render + Vercel)
└── vercel.json             Optional Vercel config when importing from repo root
```

## What's implemented

**Teacher**
- Email/password sign-in
- Dashboard with progress summary (Not Started / In Progress / Completed) and per-assignment minutes-read totals
- Create-assignment dialog: pick a book, multi-select students, pick a due date
- Filterable assignment table with overdue indicators

**Student**
- Sees only their own assignments
- Status dropdown on each assignment (dashboard and in-app reader)
- In-app book reader with a **Start / Stop timer** and **manual minute entry**
- Status auto-advances to In Progress on first logged reading time
- Mark as completed stamps `completedAt`

**Cross-cutting**
- BCrypt passwords + HMAC-signed cookie sessions (`rp_session`)
- Role-gated REST API (401/403 with `{ "error": "..." }` JSON)
- Materialized `minutesRead` on `Assignment` + append-only `ReadingSession` log
- Idempotent seed data: one teacher, three students, six books, two starter assignments

## Quick start (local)

**Prereqs:** JDK 21+, Node 18+. Maven is bundled via `./mvnw`.

```bash
# Terminal 1 — backend (8081 avoids conflicts with Docker on 8080)
cd reading-portal/backend
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081

# Terminal 2 — frontend
cd reading-portal/frontend
npm install
npm run dev                # http://localhost:5173
```

Vite proxies `/api/*` to the backend so cookies work without extra CORS setup in dev.

**Apple Silicon:** If `java` fails with a Rosetta error, use the ARM64 JDK in `.tools/` (from repo root):

```bash
export JAVA_HOME="$(pwd)/.tools/jdk-21.0.7+6/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
cd reading-portal/backend
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

### Demo credentials (seeded on boot)

| Role    | Email              | Password     |
| ------- | ------------------ | ------------ |
| Teacher | teacher@demo.com   | teacher123   |
| Student | alex@demo.com      | student123   |
| Student | jordan@demo.com    | student123   |
| Student | sam@demo.com       | student123   |

## Deploying (free tier)

See **[DEPLOY.md](./DEPLOY.md)** for the full walkthrough.

| Piece | Host | Path / setting |
| ----- | ---- | -------------- |
| Backend | [Render](https://render.com) | Blueprint: `reading-portal/render.yaml` |
| Frontend | [Vercel](https://vercel.com) | Root: `reading-portal/frontend`, env: `VITE_API_BASE` |
| CORS | Render env | `PORTAL_CORS_ORIGINS` = your Vercel URL |

## API overview

| Method | Path | Who |
| ------ | ---- | --- |
| POST | `/api/auth/login` | anyone |
| POST | `/api/auth/logout` | anyone |
| GET | `/api/auth/me` | authed |
| GET | `/api/health` | anyone |
| GET | `/api/books` | authed |
| GET | `/api/students` | teacher |
| GET | `/api/assignments` | authed |
| POST | `/api/assignments` | teacher |
| GET | `/api/assignments/{id}` | owner student/teacher |
| PATCH | `/api/assignments/{id}/status` | owner student |
| POST | `/api/assignments/{id}/sessions` | owner student |

More detail: [`reading-portal/README.md`](./reading-portal/README.md).

## Deliverables

- **GitHub:** https://github.com/Emreyanmis/scholastic-reading-portal
- **Live URL + credentials:** frontend (Vercel) + backend (Render); demo accounts above
- **Written explanation:** this README, [`reading-portal/README.md`](./reading-portal/README.md), [`DEPLOY.md`](./DEPLOY.md)
