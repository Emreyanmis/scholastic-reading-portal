import { useEffect, useMemo, useState } from "react";
import { api, AssignmentDto, AssignmentStatus, BookSummary, StudentDto } from "../lib/api";
import { AssignmentsTable } from "../components/AssignmentsTable";
import { CreateAssignmentDialog } from "../components/CreateAssignmentDialog";

type Filter = "ALL" | AssignmentStatus;

export function TeacherDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, b, s] = await Promise.all([
          api.get<AssignmentDto[]>("/api/assignments"),
          api.get<BookSummary[]>("/api/books"),
          api.get<StudentDto[]>("/api/students"),
        ]);
        setAssignments(a);
        setBooks(b);
        setStudents(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const list = assignments ?? [];
    return {
      total: list.length,
      completed: list.filter((a) => a.status === "COMPLETED").length,
      inProgress: list.filter((a) => a.status === "IN_PROGRESS").length,
      notStarted: list.filter((a) => a.status === "NOT_STARTED").length,
    };
  }, [assignments]);

  const visible = useMemo(() => {
    if (!assignments) return [];
    return filter === "ALL" ? assignments : assignments.filter((a) => a.status === filter);
  }, [assignments, filter]);

  if (error) return <div className="text-brand-600">{error}</div>;
  if (!assignments) return <div className="text-zinc-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Teacher Dashboard</h1>
          <p className="text-sm text-zinc-600">Assign reading and track progress across your students.</p>
        </div>
        <button className="btn-primary" onClick={() => setDialogOpen(true)}>
          + New assignment
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Assignments" value={stats.total} />
        <StatCard label="Not started" value={stats.notStarted} />
        <StatCard label="In progress" value={stats.inProgress} tone="amber" />
        <StatCard label="Completed" value={stats.completed} tone="emerald" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <h2 className="font-medium text-zinc-900">Assignments</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Filter:</span>
            <select
              className="input w-auto py-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
            >
              <option value="ALL">All</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            No assignments yet. Click <span className="font-medium">New assignment</span> to create one.
          </div>
        ) : (
          <AssignmentsTable assignments={visible} />
        )}
      </div>

      <CreateAssignmentDialog
        open={dialogOpen}
        books={books}
        students={students}
        onClose={() => setDialogOpen(false)}
        onCreated={(created) => {
          setAssignments((prev) => [...created, ...(prev ?? [])]);
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "amber" | "emerald";
}) {
  const cls =
    tone === "amber" ? "text-amber-700" : tone === "emerald" ? "text-emerald-700" : "text-zinc-900";
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
