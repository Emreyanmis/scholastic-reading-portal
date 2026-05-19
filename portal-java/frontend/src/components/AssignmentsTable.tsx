import type { AssignmentDto } from "../lib/api";
import { daysUntil, formatDate, statusClasses, statusLabel } from "../lib/format";
import { BookCover } from "./BookCover";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function AssignmentsTable({ assignments }: { assignments: AssignmentDto[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-stone-50/70 text-left text-[11px] uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-2.5 font-semibold">Student</th>
            <th className="px-5 py-2.5 font-semibold">Book</th>
            <th className="px-5 py-2.5 font-semibold">Due</th>
            <th className="px-5 py-2.5 font-semibold">Status</th>
            <th className="px-5 py-2.5 font-semibold text-right">Reading</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {assignments.map((a) => {
            const days = daysUntil(a.dueDate);
            const overdue = a.status !== "COMPLETED" && days < 0;
            const progress = Math.min(100, (a.minutesRead / 60) * 100); // 60 min as a soft "done" indicator
            return (
              <tr key={a.id} className="transition-colors hover:bg-stone-50/70">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-ink-grad text-white text-xs font-bold shadow-inner1">
                      {initials(a.student.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900">{a.student.name}</div>
                      <div className="text-xs text-stone-500">{a.student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <BookCover title={a.book.title} author={a.book.author} color={a.book.coverColor} size="sm" />
                    <div>
                      <div className="font-semibold text-stone-900">{a.book.title}</div>
                      <div className="text-xs text-stone-500">{a.book.author}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className={overdue ? "font-semibold text-brand-700" : "text-stone-800 font-medium"}>
                    {formatDate(a.dueDate)}
                  </div>
                  <div className="text-xs text-stone-500">
                    {a.status === "COMPLETED"
                      ? `Completed ${a.completedAt ? formatDate(a.completedAt) : ""}`
                      : overdue
                      ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
                      : `in ${days} day${days === 1 ? "" : "s"}`}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`badge ${statusClasses(a.status)}`}>{statusLabel(a.status)}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-24 hidden md:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full transition-[width] ${
                            a.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-sunny-400 to-amber-500"
                          }`}
                          style={{ width: `${a.status === "COMPLETED" ? 100 : progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="tabular-nums font-semibold text-stone-800 w-14 text-right">{a.minutesRead}m</div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
