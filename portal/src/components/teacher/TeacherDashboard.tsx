"use client";

import { useMemo, useState } from "react";
import { CreateAssignmentDialog } from "./CreateAssignmentDialog";
import { AssignmentsTable, TeacherAssignment } from "./AssignmentsTable";

type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  summary: string;
  gradeLevel: string | null;
};
type Student = { id: string; name: string; email: string };

export function TeacherDashboard({
  initialAssignments,
  books,
  students,
}: {
  initialAssignments: TeacherAssignment[];
  books: Book[];
  students: Student[];
}) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(initialAssignments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("ALL");

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === "COMPLETED").length;
    const inProgress = assignments.filter((a) => a.status === "IN_PROGRESS").length;
    const notStarted = assignments.filter((a) => a.status === "NOT_STARTED").length;
    const totalMinutes = assignments.reduce((sum, a) => sum + a.minutesRead, 0);
    return { total, completed, inProgress, notStarted, totalMinutes };
  }, [assignments]);

  const visible = useMemo(
    () => (filter === "ALL" ? assignments : assignments.filter((a) => a.status === filter)),
    [assignments, filter]
  );

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
        <StatCard label="Not started" value={stats.notStarted} tone="zinc" />
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
              onChange={(e) => setFilter(e.target.value as typeof filter)}
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
        onClose={() => setDialogOpen(false)}
        books={books}
        students={students}
        onCreated={(created) => {
          setAssignments((prev) => [...created, ...prev]);
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "zinc",
}: {
  label: string;
  value: number;
  tone?: "zinc" | "amber" | "emerald";
}) {
  const toneCls =
    tone === "amber"
      ? "text-amber-700"
      : tone === "emerald"
      ? "text-emerald-700"
      : "text-zinc-900";
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
