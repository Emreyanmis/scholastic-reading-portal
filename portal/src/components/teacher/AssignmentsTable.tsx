"use client";

import { daysUntil, formatDate, statusClasses, statusLabel } from "@/lib/format";

export type TeacherAssignment = {
  id: string;
  status: string;
  minutesRead: number;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
  book: { id: string; title: string; author: string; coverColor: string };
  student: { id: string; name: string; email: string };
};

export function AssignmentsTable({ assignments }: { assignments: TeacherAssignment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2">Student</th>
            <th className="px-4 py-2">Book</th>
            <th className="px-4 py-2">Due</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Minutes read</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {assignments.map((a) => {
            const days = daysUntil(a.dueDate);
            const overdue = a.status !== "COMPLETED" && days < 0;
            return (
              <tr key={a.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900">{a.student.name}</div>
                  <div className="text-xs text-zinc-500">{a.student.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-6 rounded-sm border border-zinc-200"
                      style={{ background: a.book.coverColor }}
                    />
                    <div>
                      <div className="font-medium text-zinc-900">{a.book.title}</div>
                      <div className="text-xs text-zinc-500">{a.book.author}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={overdue ? "text-brand-600 font-medium" : "text-zinc-700"}>
                    {formatDate(a.dueDate)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {a.status === "COMPLETED"
                      ? `Completed ${a.completedAt ? formatDate(a.completedAt) : ""}`
                      : overdue
                      ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
                      : `in ${days} day${days === 1 ? "" : "s"}`}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusClasses(a.status)}`}>{statusLabel(a.status)}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{a.minutesRead} min</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
