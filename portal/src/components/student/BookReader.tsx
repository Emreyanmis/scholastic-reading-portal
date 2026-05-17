"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, statusClasses, statusLabel } from "@/lib/format";

// The reader does two things:
//   1. Renders the book content.
//   2. Tracks an in-app reading timer. When the student presses "Stop", we POST
//      the elapsed minutes to /api/assignments/:id/sessions, which increments
//      Assignment.minutesRead and (if Not Started) advances status to In Progress.
//
// Why a manual start/stop instead of auto-tracking? It makes the student's
// intent explicit (matches how products like Reading Plus or Epic work),
// and it dodges the worst edge cases (tab left open, sleep, etc.).
// We also offer a "Log time manually" button for students who read offline.

type Assignment = {
  id: string;
  status: string;
  minutesRead: number;
  dueDate: string;
  completedAt: string | null;
};
type Book = {
  title: string;
  author: string;
  summary: string;
  coverColor: string;
  content: string;
};

export function BookReader({
  assignment: initial,
  book,
  teacherName,
}: {
  assignment: Assignment;
  book: Book;
  teacherName: string;
}) {
  const [assignment, setAssignment] = useState(initial);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

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
    const totalSec = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    startedAtRef.current = null;
    // Round up so a 30-second peek still counts as 1 minute; nicer UX.
    const minutes = Math.max(1, Math.round(totalSec / 60));
    await logMinutes(minutes);
    setElapsedSec(0);
  }

  async function logMinutes(minutes: number) {
    if (minutes <= 0) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "Could not save time");
        return;
      }
      const updated = (await res.json()) as Partial<Assignment>;
      setAssignment((prev) => ({ ...prev, ...updated }));
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "Could not update status");
        return;
      }
      const updated = (await res.json()) as Partial<Assignment>;
      setAssignment((prev) => ({ ...prev, ...updated }));
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
            <div className="mt-1 text-xs text-zinc-500">Due {formatDate(assignment.dueDate)}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`badge ${statusClasses(assignment.status)}`}>
                {statusLabel(assignment.status)}
              </span>
              <select
                className="input w-auto py-1.5 text-xs"
                value={assignment.status}
                onChange={(e) => updateStatus(e.target.value)}
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
            <span className="text-xs text-zinc-500 tabular-nums">
              Total: {assignment.minutesRead} min
            </span>
          </div>
          <div className="mt-2 grid place-items-center rounded-md bg-zinc-50 py-6">
            <div className="text-4xl font-semibold tabular-nums text-zinc-900">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{running ? "Recording..." : "Paused"}</div>
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
        {assignment.status !== "COMPLETED" && (
          <div className="mt-8 flex justify-end">
            <button
              className="btn-primary"
              onClick={() => updateStatus("COMPLETED")}
              disabled={busy}
            >
              Mark as completed
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
