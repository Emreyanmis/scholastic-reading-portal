import { FormEvent, useEffect, useState } from "react";
import { api, AssignmentDto, BookSummary, StudentDto } from "../lib/api";

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
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

  if (!open) return null;

  function toggleStudent(id: string) {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-900">New reading assignment</h2>
          <button className="btn-ghost text-zinc-500" onClick={onClose} disabled={busy}>
            Close
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-700">Book</label>
            <select
              className="input mt-1"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author}
                  {b.gradeLevel ? ` (${b.gradeLevel})` : ""}
                </option>
              ))}
            </select>
            {selectedBook && (
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{selectedBook.summary}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700">Students</label>
            <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-200 divide-y divide-zinc-100">
              {students.length === 0 ? (
                <div className="px-3 py-4 text-sm text-zinc-500">No students in the roster.</div>
              ) : (
                students.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={studentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900">{s.name}</div>
                      <div className="text-xs text-zinc-500">{s.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700">Due date</label>
            <input
              type="date"
              className="input mt-1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-sm text-brand-600">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy
                ? "Creating…"
                : `Assign to ${studentIds.length || 0} student${studentIds.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
