// Thin fetch wrapper that:
//   1) Sends/receives cookies (credentials: "include")
//   2) Uses relative /api paths in prod (Vercel rewrites → Render) so the session
//      cookie stays first-party. Only set VITE_API_BASE for direct-to-Render dev.
//   3) Parses JSON and surfaces server error messages as Error
//
// I deliberately did NOT pull in axios or react-query for a focused demo —
// the surface is small enough that a 40-line wrapper is clearer.

// Strip trailing slash so BASE + "/api/..." never becomes "//api/..." (Spring 500s on that).
const BASE = ((import.meta.env.VITE_API_BASE as string | undefined) || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Render free tier can take 30–60s to cold-start; auth calls need patience. */
export const COLD_START_TIMEOUT_MS = 90_000;

type RequestOpts = { timeoutMs?: number; retries?: number };

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTimeoutError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0;
}

/** Best-effort ping so the first real API call is less likely to time out. */
export async function wakeBackend(): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await requestOnce("GET", "/api/health", undefined, COLD_START_TIMEOUT_MS);
      return;
    } catch {
      if (attempt < 3) await delay(1500 * (attempt + 1));
    }
  }
}

async function requestOnce<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown | undefined,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: "include",
      signal: controller.signal,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError("Server is waking up — please wait a moment and try again.", 0);
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : null) || `HTTP ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  opts?: RequestOpts
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 30_000;
  const retries = opts?.retries ?? 0;
  let last: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestOnce<T>(method, path, body, timeoutMs);
    } catch (e) {
      last = e;
      const retryable = isTimeoutError(e) || (e instanceof ApiError && e.status >= 502);
      if (!retryable || attempt === retries) throw e;
      await delay(2000);
    }
  }
  throw last;
}

export const api = {
  get:   <T>(p: string, opts?: RequestOpts) => request<T>("GET", p, undefined, opts),
  post:  <T>(p: string, body?: unknown, opts?: RequestOpts) => request<T>("POST", p, body, opts),
  patch: <T>(p: string, body?: unknown, opts?: RequestOpts) => request<T>("PATCH", p, body, opts),
};

// --- Wire types (must stay in sync with backend DTOs) ---------------------

export type Role = "TEACHER" | "STUDENT";
export type AssignmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type UserDto = { id: string; email: string; name: string; role: Role };
export type StudentDto = { id: string; name: string; email: string };
export type TeacherSummary = { id: string; name: string };

export type BookSummary = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  summary: string;
  gradeLevel: string | null;
};

export type BookFull = BookSummary & { content: string };

export type AssignmentDto = {
  id: string;
  bookId: string;
  book: BookSummary;
  teacherId: string;
  teacher: TeacherSummary;
  studentId: string;
  student: StudentDto;
  dueDate: string;
  status: AssignmentStatus;
  minutesRead: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
