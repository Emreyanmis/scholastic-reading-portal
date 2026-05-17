import { useEffect, useRef, useState } from "react";
import { api, AssignmentStatus, BookFull } from "../lib/api";
import { formatDate, statusClasses, statusLabel } from "../lib/format";

// The reader has two purposes:
//   1. Render the book content.
//   2. Track an in-app reading timer. When the student presses "Stop", we POST
//      the elapsed minutes to /api/assignments/:id/sessions, which increments
//      Assignment.minutesRead and (if Not Started) flips status to In Progress.
//
// Manual start/stop instead of auto-tracking — makes the student's intent
// explicit and avoids tab-left-open / asleep-laptop false positives. Manual
// entry is also offered for students who read offline.

type AssignmentSummary = {
  id: string;
  status: AssignmentStatus;
  minutesRead: number;
  dueDate: string;
  completedAt: string | null;
};

export function BookReader({
  initial,
  book,
  teacherName,
  onChange,
}: {
  initial: AssignmentSummary;
  book: BookFull;
  teacherName: string;
  onChange: (patch: Partial<AssignmentSummary>) => void;
}) {
  const [a, setA] = useState<AssignmentSummary>(initial);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
  }, []);

  function patch(p: Partial<AssignmentSummary>) {
    setA((prev) => ({ ...prev, ...p }));
    onChange(p);
  }

  function start() {
    if (running) return;
    setError(null);
    setRunning(true);
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    tickRef.current = window.setInterval(() => {
      if (!startedAtRef.current) return;
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  }

  async function stopAndLog() {
    if (!running) return;
    setRunning(false);
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const totalSec = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
    startedAtRef.current = null;
    // Round up so a short peek still counts as 1 minute; nicer UX.
    const minutes = Math.max(1, Math.round(totalSec / 60));
    await logMinutes(minutes);
    setElapsedSec(0);
  }

  async function logMinutes(minutes: number) {
    if (minutes <= 0) return;
    setBusy(true);
    try {
      const updated = await api.post<AssignmentSummary>(`/api/assignments/${a.id}/sessions`, { minutes });
      patch({ status: updated.status, minutesRead: updated.minutesRead });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save time");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: AssignmentStatus) {
    setError(null);
    setBusy(true);
    try {
      const updated = await api.patch<AssignmentSummary>(`/api/assignments/${a.id}/status`, { status });
      patch({ status: updated.status, completedAt: updated.completedAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <aside className="lg:col-span-1 space-y-3">
        <div className="card overflow-hidden">
          <div className="h-32" style={{ background: book.coverColor }} />
          <div className="p-4">
            <h1 className="text-lg font-semibold text-zinc-900">{book.title}</h1>
            <div className="text-xs text-zinc-500">{book.author}</div>
            <p className="mt-2 text-sm text-zinc-700">{book.summary}</p>
            <div className="mt-3 text-xs text-zinc-500">Assigned by {teacherName}</div>
            <div className="mt-1 text-xs text-zinc-500">Due {formatDate(a.dueDate)}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`badge ${statusClasses(a.status)}`}>{statusLabel(a.status)}</span>
              <select
                className="input w-auto py-1.5 text-xs"
                value={a.status}
                onChange={(e) => updateStatus(e.target.value as AssignmentStatus)}
                disabled={busy}
                aria-label="Update status"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium text-zinc-900">Reading timer</h3>
            <span className="text-xs text-zinc-500 tabular-nums">Total: {a.minutesRead} min</span>
          </div>
          <div className="mt-2 grid place-items-center rounded-md bg-zinc-50 py-6">
            <div className="text-4xl font-semibold tabular-nums text-zinc-900">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{running ? "Recording…" : "Paused"}</div>
          </div>
          <div className="mt-3 flex gap-2">
            {!running ? (
              <button className="btn-primary flex-1" onClick={start} disabled={busy}>
                Start reading
              </button>
            ) : (
              <button className="btn-secondary flex-1" onClick={stopAndLog} disabled={busy}>
                Stop &amp; save time
              </button>
            )}
            <button
              className="btn-ghost text-zinc-700"
              onClick={() => setManualOpen((v) => !v)}
              disabled={busy || running}
            >
              Log manually
            </button>
          </div>
          {manualOpen && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={600}
                className="input"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value))}
              />
              <button
                className="btn-primary"
                onClick={async () => {
                  await logMinutes(manualMinutes);
                  setManualOpen(false);
                }}
                disabled={busy || manualMinutes <= 0}
              >
                Add
              </button>
            </div>
          )}
          {error && <div className="mt-2 text-sm text-brand-600">{error}</div>}
        </div>
      </aside>

      <article className="card lg:col-span-2 p-6">
        <h2 className="text-xl font-semibold text-zinc-900">{book.title}</h2>
        <div className="mt-1 text-sm text-zinc-500">by {book.author}</div>
        <div className="prose prose-zinc mt-6 max-w-none whitespace-pre-wrap text-[15px] leading-7 text-zinc-800">
          {book.content}
        </div>
        {a.status !== "COMPLETED" && (
          <div className="mt-8 flex justify-end">
            <button className="btn-primary" onClick={() => updateStatus("COMPLETED")} disabled={busy}>
              Mark as completed
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
