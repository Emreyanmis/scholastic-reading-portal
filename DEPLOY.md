# Deploying the Reading Portal — free tier

This repo ships **two implementations** of the same Reading Portal. Both have
free-tier deploy paths.

| Variant | Path | Where it deploys to | Cost |
| ------- | ---- | ------------------- | ---- |
| Next.js full-stack | [`portal/`](./portal) | **Vercel** (frontend + API) + **Neon** (Postgres) | $0 |
| Spring Boot + React | [`portal-java/`](./portal-java) | **Render** (backend) + **Vercel** (frontend) | $0 (Render free sleeps after 15 min idle) |

Pick whichever you want to demo. Step-by-step recipes below.

---

## Pre-flight: push to GitHub

Both recipes deploy from a GitHub repo. From the repo root:

```bash
# Create an empty public repo on github.com first (don't initialize it),
# then connect and push:
git remote add origin git@github.com:<your-username>/scholastic-reading-portal.git
git push -u origin main
```

If you'd rather create the repo from the CLI: `gh repo create scholastic-reading-portal --public --source=. --push`.

---

## Recipe A — Next.js → Vercel + Neon  (recommended for fastest demo)

### 1. Provision a free Postgres on Neon  (~2 minutes)

1. Go to [neon.tech](https://neon.tech), sign up (GitHub login works)
2. Create a new project — name it `reading-portal`. Region: closest to you.
3. On the project dashboard, copy the **Pooled connection string** (it looks like `postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`).
4. Keep this tab open — you'll paste it into Vercel in a second.

### 2. Deploy to Vercel  (~3 minutes)

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub
2. Import your `scholastic-reading-portal` repo
3. **Root directory:** click "Edit" and set it to `portal`
4. Framework should auto-detect as **Next.js**
5. Expand **Environment Variables** and add three:
   - `DATABASE_URL` — paste the Neon pooled connection string
   - `SESSION_SECRET` — paste a long random string. Generate with `openssl rand -hex 32`
   - `ADMIN_SEED_TOKEN` — paste another long random string. Generate the same way
6. Click **Deploy**. First build takes ~2 minutes; Vercel runs `prisma db push` against your Neon DB so the tables get created automatically.

### 3. Seed the database  (~10 seconds)

After the first deploy finishes, run this from any terminal (use the URL Vercel gave you):

```bash
curl -X POST https://<your-app>.vercel.app/api/admin/seed \
     -H "x-admin-token: <your-ADMIN_SEED_TOKEN>"
```

You should get back `{"seeded":true,"users":4,"books":6,"assignments":2}`.

### 4. Sign in

Open `https://<your-app>.vercel.app` and log in with:

- Teacher: `teacher@demo.com` / `teacher123`
- Student: `alex@demo.com` / `student123`

That's it. Total $0 forever — Vercel hobby tier + Neon free tier.

---

## Recipe B — Spring Boot + React → Render + Vercel

### 1. Deploy the backend to Render  (~5 minutes)

1. Sign up at [render.com](https://render.com) (GitHub login works)
2. New → **Blueprint** → connect this repo
3. Render reads [`portal-java/render.yaml`](./portal-java/render.yaml) and provisions a `reading-portal-backend` web service from the Dockerfile
4. Render auto-generates `PORTAL_SESSION_SECRET`. You can leave `PORTAL_CORS_ORIGINS` as the placeholder for now — we'll update it after Vercel.
5. Click **Apply**. First Docker build takes ~4 minutes. Render gives you a public URL like `https://reading-portal-backend.onrender.com`.

Verify with: `curl https://reading-portal-backend.onrender.com/api/health` → should return `{"status":"ok"}` (200).

### 2. Deploy the frontend to Vercel  (~3 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same repo
3. **Root directory:** set it to `portal-java/frontend`
4. Framework should auto-detect as **Vite**
5. Environment Variables:
   - `VITE_API_BASE` — your Render backend URL **with no trailing slash**, e.g. `https://reading-portal-backend.onrender.com`
6. Click **Deploy**. Vercel gives you a URL like `https://reading-portal-frontend.vercel.app`.

### 3. Tell the backend about the frontend  (~1 minute)

Cookies have to flow cross-site, so the backend needs to allow the Vercel origin:

1. Render dashboard → `reading-portal-backend` → **Environment**
2. Edit `PORTAL_CORS_ORIGINS` to your Vercel URL: `https://reading-portal-frontend.vercel.app`
3. Save — Render redeploys (~1 minute)

### 4. Sign in

Open your Vercel URL. The free Render service may take ~30 seconds to wake up on the first request (it sleeps after 15 min idle), then it's snappy. SeedRunner repopulates the in-memory H2 database on every cold start, so the demo accounts are always available:

- Teacher: `teacher@demo.com` / `teacher123`
- Student: `alex@demo.com` / `student123`

### About the "data resets on cold start" caveat

Render's free tier doesn't include a persistent disk, so the Spring Boot backend
runs H2 **in-memory** (see [`application-prod.yml`](./portal-java/backend/src/main/resources/application-prod.yml)).
Demo data is recreated by the `SeedRunner` on every boot, which is fine for an
interview demo — any new assignments a tester creates during a session will be
preserved until the next cold start.

To keep data permanently:
- Render: upgrade the service to the $7/month starter tier and attach a 1 GB disk, switching the JDBC URL back to `jdbc:h2:file:./data/portal`
- Or: provision a managed Postgres (Neon free works fine) and swap the JDBC URL + add the `postgresql` JDBC driver to `pom.xml`

---

## Architecture quick reference

```
                    Recipe A (Next.js, $0)
                    ─────────────────────────────────
                                 Vercel
   user ──HTTPS──▶  ┌───────────────────────────────┐
                    │  Next.js  (UI + API routes)   │
                    │     │                         │
                    │     └───SQL──▶  Neon Postgres │
                    └───────────────────────────────┘


                    Recipe B (Spring Boot + React, $0)
                    ─────────────────────────────────
                  Vercel                         Render
   user ─HTTPS─▶  ┌─────────────┐    ┌────────────────────────┐
                  │   Vite/dist │──▶ │  Spring Boot + H2-mem  │
                  │   React SPA │    │  (cold-starts on idle) │
                  └─────────────┘    └────────────────────────┘
                   cookies: SameSite=None; Secure  (cross-site)
                   CORS allow-list contains the Vercel origin
```

---

## What to send Scholastic

The deliverables list asks for:

1. **GitHub repository** — `https://github.com/<you>/scholastic-reading-portal`
2. **Live deployed URL with credentials** — whichever recipe you picked:
   - Recipe A: `https://<your-app>.vercel.app` (no separate backend URL — single artifact)
   - Recipe B: frontend at `https://reading-portal-frontend.vercel.app`, backend at `https://reading-portal-backend.onrender.com` (you can include both for completeness)
3. **Written explanation** — the per-variant READMEs and this deploy doc cover what was implemented, key decisions, tradeoffs, and what you'd improve with more time

Demo accounts to include in the submission email:

```
Teacher: teacher@demo.com / teacher123
Student: alex@demo.com    / student123
Student: jordan@demo.com  / student123
```
