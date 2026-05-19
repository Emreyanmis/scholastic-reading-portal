import { useEffect, useMemo, useState } from "react";
import { api, AssignmentDto, AssignmentStatus, BookSummary, StudentDto } from "../lib/api";
import { useAuth } from "../lib/auth";
import { AssignmentsTable } from "../components/AssignmentsTable";
import { CreateAssignmentDialog } from "../components/CreateAssignmentDialog";
import { IconBook, IconCheck, IconHourglass, IconPlus, IconSparkle, IconUsers } from "../components/icons";

type Filter = "ALL" | AssignmentStatus;

export function TeacherDashboardPage() {
  const { user } = useAuth();
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
      minutes: list.reduce((s, a) => s + a.minutesRead, 0),
      students: new Set(list.map((a) => a.studentId)).size,
    };
  }, [assignments]);

  const visible = useMemo(() => {
    if (!assignments) return [];
    return filter === "ALL" ? assignments : assignments.filter((a) => a.status === filter);
  }, [assignments, filter]);

  if (error) return <div className="card p-6 text-brand-700 bg-brand-50">{error}</div>;
  if (!assignments) return <div className="text-stone-500">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="card-floaty overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              <IconSparkle size={12} className="inline" /> {user ? `Welcome, ${user.name.split(" ")[0]}` : "Teacher"}
            </div>
            <h1 className="display mt-1 text-3xl font-bold text-stone-900">Your class, at a glance</h1>
            <p className="mt-1 text-sm text-stone-600">
              Track every reading assignment and how each student is progressing.
            </p>
          </div>
          <button className="btn-primary px-5 py-2.5" onClick={() => setDialogOpen(true)}>
            <IconPlus size={14} /> New assignment
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 pb-6 md:grid-cols-4">
          <StatCard
            icon={<IconBook size={18} />}
            tint="ink"
            label="Assignments"
            value={stats.total}
            hint={`${stats.students} student${stats.students === 1 ? "" : "s"}`}
          />
          <StatCard
            icon={<IconHourglass size={18} />}
            tint="stone"
            label="Not Started"
            value={stats.notStarted}
          />
          <StatCard
            icon={<IconUsers size={18} />}
            tint="amber"
            label="In Progress"
            value={stats.inProgress}
            hint={`${stats.minutes} min total`}
          />
          <StatCard
            icon={<IconCheck size={18} />}
            tint="emerald"
            label="Completed"
            value={stats.completed}
          />
        </div>
      </section>

      <section className="card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-stone-900">Assignments</h2>
            <span className="badge bg-stone-100 text-stone-600">{assignments.length}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FilterPill value="ALL"          current={filter} onChange={setFilter}>All</FilterPill>
            <FilterPill value="NOT_STARTED"  current={filter} onChange={setFilter}>Not Started</FilterPill>
            <FilterPill value="IN_PROGRESS"  current={filter} onChange={setFilter}>In Progress</FilterPill>
            <FilterPill value="COMPLETED"    current={filter} onChange={setFilter}>Completed</FilterPill>
          </div>
        </header>
        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-stone-500">
            {assignments.length === 0 ? (
              <>
                <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sunny-grad text-stone-900 shadow-soft">
                  <IconBook size={18} />
                </div>
                <div className="mt-2 font-semibold text-stone-700">No assignments yet</div>
                <div>Click <span className="font-semibold">New assignment</span> to get started.</div>
              </>
            ) : (
              <>No assignments match that filter.</>
            )}
          </div>
        ) : (
          <AssignmentsTable assignments={visible} />
        )}
      </section>

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
  icon, label, value, hint, tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tint: "ink" | "stone" | "amber" | "emerald";
}) {
  const map: Record<string, string> = {
    ink:     "bg-ink-100 text-ink-700",
    stone:   "bg-stone-100 text-stone-700",
    amber:   "bg-sunny-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 shadow-soft">
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center justify-center rounded-xl p-2 ${map[tint]}`}>{icon}</div>
        {hint && <div className="text-[10px] uppercase tracking-wider text-stone-400">{hint}</div>}
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums text-stone-900">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</div>
    </div>
  );
}

function FilterPill({
  value, current, onChange, children,
}: {
  value: Filter;
  current: Filter;
  onChange: (f: Filter) => void;
  children: React.ReactNode;
}) {
  const active = value === current;
  return (
    <button
      onClick={() => onChange(value)}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition
        ${active
          ? "bg-stone-900 text-white shadow-soft"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
    >
      {children}
    </button>
  );
}
