import { useEffect, useRef, useState } from "react";
import { api, AssignmentStatus, BookFull } from "../lib/api";
import { formatDate, statusClasses, statusLabel } from "../lib/format";
import { IconBook, IconCalendar, IconCheck, IconClock, IconPause, IconPlay, IconPlus } from "./icons";
import { StatusSelect } from "./StatusSelect";

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
  const [justLogged, setJustLogged] = useState<number | null>(null);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
  }, []);

  useEffect(() => {
    if (justLogged === null) return;
    const t = window.setTimeout(() => setJustLogged(null), 2200);
    return () => window.clearTimeout(t);
  }, [justLogged]);

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
      setJustLogged(minutes);
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
  const minutesPct = Math.min(100, (a.minutesRead / 60) * 100);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Sidebar ------------------------------------------------------ */}
      <aside className="lg:col-span-1 space-y-4">
        <div className="card overflow-hidden">
          <div
            className="relative h-44"
            style={{ background: `linear-gradient(135deg, ${book.coverColor} 0%, ${shade(book.coverColor, -14)} 100%)` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-10%,rgba(255,255,255,0.6),transparent)]" />
            <div className="absolute inset-x-5 inset-y-4 flex flex-col justify-between">
              <span className={`badge w-fit ${statusClasses(a.status)}`}>{statusLabel(a.status)}</span>
              <div>
                <div className="font-display text-xl font-semibold leading-tight text-stone-900">{book.title}</div>
                <div className="text-xs text-stone-700/80">{book.author}</div>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-sm text-stone-700">{book.summary}</p>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <IconCalendar size={13} /> Due {formatDate(a.dueDate)} · assigned by {teacherName}
            </div>
            <div>
              <label className="label">Status</label>
              <StatusSelect
                value={a.status}
                onChange={updateStatus}
                disabled={busy}
                size="md"
              />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="display font-semibold text-stone-900">Reading timer</h3>
            <span className="text-xs text-stone-500 tabular-nums">Total: {a.minutesRead} min</span>
          </div>

          <div className="mt-3 grid place-items-center rounded-2xl bg-gradient-to-br from-stone-50 to-cream-100 py-7 ring-1 ring-stone-100">
            <div className="relative grid h-32 w-32 place-items-center rounded-full bg-white shadow-inner1 ring-1 ring-stone-200">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    `conic-gradient(${running ? "#f43f5e" : "#fbbf24"} ${(elapsedSec % 60) * 6}deg, transparent 0)`,
                  WebkitMask: "radial-gradient(circle, transparent 56%, black 57%)",
                  mask: "radial-gradient(circle, transparent 56%, black 57%)",
                }}
              />
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums text-stone-900">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                  {running ? "Recording" : "Paused"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
              <span><IconClock size={12} className="inline" /> Progress toward 60 min</span>
              <span className="tabular-nums">{a.minutesRead} / 60</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div className="h-full bg-sunny-grad transition-[width]" style={{ width: `${minutesPct}%` }} />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {!running ? (
              <button className="btn-primary flex-1" onClick={start} disabled={busy}>
                <IconPlay size={14} /> Start reading
              </button>
            ) : (
              <button className="btn-secondary flex-1" onClick={stopAndLog} disabled={busy}>
                <IconPause size={14} /> Stop &amp; save
              </button>
            )}
            <button
              className="btn-ghost px-3"
              onClick={() => setManualOpen((v) => !v)}
              disabled={busy || running}
              title="Log time manually"
            >
              <IconPlus size={14} />
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
                className="btn-sunny"
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

          {justLogged !== null && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100 animate-fade-in">
              <IconCheck size={14} /> Nice! Logged {justLogged} min.
            </div>
          )}
          {error && <div className="mt-2 text-sm text-brand-600">{error}</div>}
        </div>
      </aside>

      {/* Reader -------------------------------------------------------- */}
      <article className="card lg:col-span-2 overflow-hidden">
        <header className="border-b border-stone-200/70 px-7 py-5 bg-cream-50">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500">
            <IconBook size={13} /> Reading mode
          </div>
          <h2 className="display mt-1 text-3xl font-bold text-stone-900">{book.title}</h2>
          <div className="mt-0.5 text-sm text-stone-500">by {book.author}</div>
        </header>
        <div className="px-7 py-7">
          <div className="prose prose-stone mx-auto max-w-3xl whitespace-pre-wrap font-serif text-[17px] leading-[1.85] text-stone-800">
            {book.content}
          </div>
          {a.status !== "COMPLETED" && (
            <div className="mt-10 flex justify-end">
              <button className="btn-success" onClick={() => updateStatus("COMPLETED")} disabled={busy}>
                <IconCheck size={14} /> Mark as completed
              </button>
            </div>
          )}
          {a.status === "COMPLETED" && (
            <div className="mt-10 rounded-2xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-100">
              <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-soft">
                <IconCheck size={18} />
              </div>
              <div className="display mt-2 text-lg font-semibold text-emerald-800">All done!</div>
              <div className="text-sm text-emerald-700">
                You finished this book. {a.minutesRead} minutes read · great work.
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adj = (v: number) => Math.max(0, Math.min(255, Math.round(v + (v * percent) / 100)));
  return `#${[adj(r), adj(g), adj(b)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
