export function formatDate(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(d: string | Date): number {
  const dt = typeof d === "string" ? new Date(d) : d;
  const ms = dt.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function statusLabel(s: string): string {
  switch (s) {
    case "NOT_STARTED":
      return "Not Started";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    default:
      return s;
  }
}

export function statusClasses(s: string): string {
  switch (s) {
    case "NOT_STARTED":
      return "bg-zinc-100 text-zinc-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}
