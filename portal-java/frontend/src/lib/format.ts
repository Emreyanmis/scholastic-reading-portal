import type { AssignmentStatus } from "./api";

export function formatDate(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(d: string | Date): number {
  const dt = typeof d === "string" ? new Date(d) : d;
  return Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function statusLabel(s: AssignmentStatus): string {
  return s === "NOT_STARTED" ? "Not Started" : s === "IN_PROGRESS" ? "In Progress" : "Completed";
}

export function statusClasses(s: AssignmentStatus): string {
  // Badges include a small dot indicator via ::before so they read at a glance.
  return s === "NOT_STARTED"
    ? "bg-stone-100 text-stone-700 ring-1 ring-stone-200"
    : s === "IN_PROGRESS"
    ? "bg-sunny-100 text-amber-800 ring-1 ring-amber-200"
    : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
}
