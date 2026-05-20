# Deploying the Reading Portal — free tier

Spring Boot backend on **Render** + React frontend on **Vercel**. Total cost: **$0**.

| Piece | Service | Notes |
| ----- | ------- | ----- |
| API | Render | Docker, H2 in-memory on free tier |
| UI | Vercel | Static Vite build |

---

## Pre-flight: push to GitHub

```bash
git remote add origin git@github.com:<your-username>/scholastic-reading-portal.git
git push -u origin main
```

Or: `gh repo create scholastic-reading-portal --public --source=. --push`

---

## 1. Deploy the backend to Render (~5 minutes)

1. Sign up at [render.com](https://render.com) (GitHub login works)
2. **New → Blueprint** → connect this repo
3. **Blueprint path:** `reading-portal/render.yaml` (not `render.yaml` at repo root)
4. Click **Apply**. First Docker build takes ~4–8 minutes
5. Note your URL, e.g. `https://reading-portal-backend.onrender.com`

Verify:

```bash
curl https://reading-portal-backend.onrender.com/api/health
# → {"status":"ok"}
```

---

## 2. Deploy the frontend to Vercel (~3 minutes)

1. [vercel.com/new](https://vercel.com/new) → import `scholastic-reading-portal`
2. **Root directory:** `reading-portal/frontend`
3. Framework: **Vite**
4. **Environment variable:**

| Name | Value |
|------|--------|
| `VITE_API_BASE` | `https://reading-portal-backend.onrender.com` (no trailing slash) |

5. **Deploy** → copy your Vercel URL, e.g. `https://scholastic-reading-portal.vercel.app`

If you already deployed with the wrong root, fix **Settings → Build and Deployment → Root Directory**, then **Redeploy**.

---

## 3. Connect frontend ↔ backend (~1 minute)

1. Render → `reading-portal-backend` → **Environment**
2. Set **`PORTAL_CORS_ORIGINS`** to your **exact** Vercel URL (with `https://`)
3. **Save** (Render redeploys ~1 min)

Without this step, login from the browser will fail.

---

## 4. Sign in

Open your **Vercel** URL (not Render).

- Teacher: `teacher@demo.com` / `teacher123`
- Student: `alex@demo.com` / `student123`

First request after ~15 min idle may take ~30s while Render wakes up.

---

## Architecture

```
                  Vercel                         Render
 user ─HTTPS─▶  ┌─────────────┐    ┌────────────────────────┐
                │  React SPA  │──▶ │  Spring Boot + H2 (mem) │
                │  (Vite)     │    │  SeedRunner on boot     │
                └─────────────┘    └────────────────────────┘
                 VITE_API_BASE        PORTAL_CORS_ORIGINS
                 cookies: SameSite=None; Secure
```

---

## Data on Render free tier

H2 runs **in-memory** in production (no persistent disk on free tier). `SeedRunner` recreates demo data on every cold start. Assignments created during a session are lost after the next cold start.

To persist data: attach a Render disk and use `jdbc:h2:file:./data/portal`, or switch to managed Postgres (Neon) + JDBC driver in `pom.xml`.

---

## What to send Scholastic

1. **GitHub:** https://github.com/Emreyanmis/scholastic-reading-portal
2. **Live URLs:** Vercel frontend + Render backend (optional but clear)
3. **Demo credentials:**

```
Teacher: teacher@demo.com / teacher123
Student: alex@demo.com    / student123
Student: jordan@demo.com  / student123
```

4. **Written explanation:** [`README.md`](./README.md), [`reading-portal/README.md`](./reading-portal/README.md)
