// Thin fetch wrapper that:
//   1) Sends/receives cookies (credentials: "include")
//   2) Routes through VITE_API_BASE if set (for prod), else relative (dev proxy)
//   3) Parses JSON and surfaces server error messages as Error
//
// I deliberately did NOT pull in axios or react-query for a focused demo —
// the surface is small enough that a 40-line wrapper is clearer.

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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

export const api = {
  get:  <T>(p: string) => request<T>("GET", p),
  post: <T>(p: string, body?: unknown) => request<T>("POST", p, body),
  patch:<T>(p: string, body?: unknown) => request<T>("PATCH", p, body),
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
