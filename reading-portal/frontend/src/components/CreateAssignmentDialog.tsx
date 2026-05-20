import { FormEvent, useEffect, useState } from "react";
import { api, AssignmentDto, BookSummary, StudentDto } from "../lib/api";
import { BookCover } from "./BookCover";
import { IconCalendar, IconCheck, IconPlus, IconUsers } from "./icons";

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function CreateAssignmentDialog({
  open,
  onClose,
  books,
  students,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  books: BookSummary[];
  students: StudentDto[];
  onCreated: (created: AssignmentDto[]) => void;
}) {
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setBookId(books[0]?.id ?? "");
      setStudentIds([]);
      setDueDate(defaultDueDate());
      setError(null);
    }
  }, [open, books]);

  // Close on escape for keyboard accessibility.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggleStudent(id: string) {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setStudentIds((prev) => (prev.length === students.length ? [] : students.map((s) => s.id)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bookId) return setError("Pick a book");
    if (studentIds.length === 0) return setError("Pick at least one student");
    setBusy(true);
    try {
      const res = await api.post<{ created: number; assignments: AssignmentDto[] }>(
        "/api/assignments",
        { bookId, studentIds, dueDate: new Date(dueDate).toISOString() }
      );
      onCreated(res.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const selectedBook = books.find((b) => b.id === bookId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white shadow-lift overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-stone-200/70 bg-gradient-to-br from-brand-50 to-cream-50">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              <IconPlus size={12} className="inline" /> Create assignment
            </div>
            <h2 className="display mt-1 text-2xl font-bold text-stone-900">Assign a book</h2>
            <p className="text-sm text-stone-600">
              Pick a book, choose students, and set a due date.
            </p>
          </div>
          <button className="btn-ghost text-stone-500 px-2 py-1" onClick={onClose} disabled={busy}>
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 px-6 py-5 md:grid-cols-2">
          {/* Book picker --------------------------------------------- */}
          <div>
            <label className="label">Book</label>
            <div className="mt-2 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto scrollbar-soft pr-1">
              {books.map((b) => {
                const active = b.id === bookId;
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setBookId(b.id)}
                    className={`group flex items-center gap-2.5 rounded-2xl bg-white p-2.5 text-left transition
                      ${active
                        ? "ring-2 ring-brand-400 shadow-soft"
                        : "ring-1 ring-stone-200 hover:ring-stone-300"}`}
                  >
                    <BookCover title={b.title} color={b.coverColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-stone-900">{b.title}</div>
                      <div className="truncate text-[11px] text-stone-500">{b.author}</div>
                      {b.gradeLevel && (
                        <div className="mt-0.5 inline-block rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                          {b.gradeLevel}
                        </div>
                      )}
                    </div>
                    {active && (
                      <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
                        <IconCheck size={11} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedBook && (
              <p className="mt-2 text-xs text-stone-500 line-clamp-2">{selectedBook.summary}</p>
            )}
          </div>

          {/* Students ------------------------------------------------- */}
          <div>
            <div className="flex items-center justify-between">
              <label className="label flex items-center gap-1.5">
                <IconUsers size={12} /> Students
              </label>
              <button
                type="button"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                onClick={toggleAll}
              >
                {studentIds.length === students.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100 scrollbar-soft">
              {students.length === 0 ? (
                <div className="px-3 py-4 text-sm text-stone-500">No students in the roster.</div>
              ) : (
                students.map((s) => {
                  const checked = studentIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition
                        ${checked ? "bg-brand-50/60" : "hover:bg-stone-50"}`}
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-ink-grad text-white text-xs font-bold shadow-inner1">
                        {initials(s.name)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-stone-900">{s.name}</div>
                        <div className="text-xs text-stone-500">{s.email}</div>
                      </div>
                      <div
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md transition
                          ${checked ? "bg-brand-500 text-white" : "ring-1 ring-stone-300 bg-white"}`}
                      >
                        {checked && <IconCheck size={11} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4">
              <label className="label flex items-center gap-1.5">
                <IconCalendar size={12} /> Due date
              </label>
              <input
                type="date"
                className="input mt-1.5"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="md:col-span-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-100">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex items-center justify-between gap-2 pt-1">
            <div className="text-xs text-stone-500">
              {studentIds.length > 0
                ? `Will create ${studentIds.length} assignment${studentIds.length === 1 ? "" : "s"}.`
                : "Pick at least one student."}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy || studentIds.length === 0}>
                {busy
                  ? "Creating…"
                  : `Assign to ${studentIds.length || 0} student${studentIds.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
