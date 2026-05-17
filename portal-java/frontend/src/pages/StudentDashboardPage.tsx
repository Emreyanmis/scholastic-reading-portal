import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, AssignmentDto, AssignmentStatus } from "../lib/api";
import { daysUntil, formatDate, statusClasses, statusLabel } from "../lib/format";

export function StudentDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setAssignments(await api.get<AssignmentDto[]>("/api/assignments"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  async function updateStatus(id: string, status: AssignmentStatus) {
    try {
      const updated = await api.patch<AssignmentDto>(`/api/assignments/${id}/status`, { status });
      setAssignments((prev) => prev?.map((a) => (a.id === id ? { ...a, ...updated } : a)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }

  if (error) return <div className="text-brand-600">{error}</div>;
  if (!assignments) return <div className="text-zinc-500">Loading…</div>;
  if (assignments.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">No reading assigned yet</h1>
        <p className="mt-1 text-sm text-zinc-600">Your teacher hasn&apos;t assigned anything. Check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">My Reading</h1>
        <p className="text-sm text-zinc-600">Open a book to start reading and log your minutes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {assignments.map((a) => {
          const days = daysUntil(a.dueDate);
          const overdue = a.status !== "COMPLETED" && days < 0;
          return (
            <div key={a.id} className="card overflow-hidden">
              <div className="flex">
                <div className="w-20 shrink-0 border-r border-zinc-200" style={{ background: a.book.coverColor }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-zinc-900">{a.book.title}</h2>
                      <div className="text-xs text-zinc-500">
                        {a.book.author} · assigned by {a.teacher.name}
                      </div>
                    </div>
                    <span className={`badge ${statusClasses(a.status)}`}>{statusLabel(a.status)}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700 line-clamp-2">{a.book.summary}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <div>
                      Due {formatDate(a.dueDate)}{" "}
                      <span className={overdue ? "text-brand-600 font-medium" : ""}>
                        {a.status === "COMPLETED"
                          ? ""
                          : overdue
                          ? `(${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue)`
                          : `(in ${days} day${days === 1 ? "" : "s"})`}
                      </span>
                    </div>
                    <div className="tabular-nums">{a.minutesRead} min read</div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link to={`/student/assignments/${a.id}`} className="btn-primary">
                      Open book
                    </Link>
                    <select
                      className="input w-auto py-1.5"
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as AssignmentStatus)}
                      aria-label="Update status"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
