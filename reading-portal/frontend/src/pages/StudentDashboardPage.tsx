import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, AssignmentDto, AssignmentStatus } from "../lib/api";
import { useAuth } from "../lib/auth";
import { daysUntil, formatDate, statusClasses, statusLabel } from "../lib/format";
import { IconBook, IconCalendar, IconClock, IconPlay, IconCheck } from "../components/icons";
import { StatusSelect } from "../components/StatusSelect";

const READING_GOAL_MIN = 60; // simple visual target for the progress bar

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setAssignments(await api.get<AssignmentDto[]>("/api/assignments"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  async function updateStatus(id: string, status: AssignmentStatus) {
    try {
      const updated = await api.patch<AssignmentDto>(`/api/assignments/${id}/status`, { status });
      setAssignments((prev) => prev?.map((a) => (a.id === id ? { ...a, ...updated } : a)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }

  const totals = useMemo(() => {
    const list = assignments ?? [];
    return {
      open: list.filter((a) => a.status !== "COMPLETED").length,
      done: list.filter((a) => a.status === "COMPLETED").length,
      minutes: list.reduce((s, a) => s + a.minutesRead, 0),
    };
  }, [assignments]);

  if (error) return <div className="card p-6 text-brand-700 bg-brand-50">{error}</div>;
  if (!assignments) return <SkeletonGrid />;

  return (
    <div className="space-y-8 animate-fade-in">
      <Hero
        name={user?.name ?? "Reader"}
        open={totals.open}
        done={totals.done}
        minutes={totals.minutes}
      />

      {assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} a={a} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hero({
  name, open, done, minutes,
}: { name: string; open: number; done: number; minutes: number }) {
  return (
    <section className="card-floaty overflow-hidden">
      <div className="grid gap-6 p-6 md:grid-cols-3 md:items-center">
        <div className="md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Hi {name.split(" ")[0]} 👋
          </div>
          <h1 className="display mt-1 text-3xl font-bold text-stone-900">
            Let&apos;s read something today.
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            You have <span className="font-semibold text-stone-900">{open}</span> open assignment
            {open === 1 ? "" : "s"} and have read{" "}
            <span className="font-semibold text-stone-900">{minutes}</span> minute{minutes === 1 ? "" : "s"} so far.
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Daily goal</span>
              <span className="tabular-nums">{Math.min(minutes, READING_GOAL_MIN)} / {READING_GOAL_MIN} min</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-sunny-grad transition-[width] duration-700"
                style={{ width: `${Math.min(100, (minutes / READING_GOAL_MIN) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-2">
          <Stat icon={<IconBook size={14} />} value={open} label="Open" tone="ink" />
          <Stat icon={<IconCheck size={14} />} value={done} label="Done" tone="emerald" />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon, value, label, tone,
}: { icon: React.ReactNode; value: number; label: string; tone: "ink" | "emerald" | "amber" }) {
  const toneCls =
    tone === "ink" ? "bg-ink-100 text-ink-700" :
    tone === "emerald" ? "bg-emerald-100 text-emerald-700" :
    "bg-sunny-100 text-amber-700";
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-stone-200 shadow-soft">
      <div className={`inline-flex items-center justify-center rounded-full p-1.5 ${toneCls}`}>{icon}</div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums text-stone-900">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-stone-500">{label}</div>
    </div>
  );
}

function AssignmentCard({
  a, onStatusChange,
}: { a: AssignmentDto; onStatusChange: (id: string, s: AssignmentStatus) => void }) {
  const days = daysUntil(a.dueDate);
  const overdue = a.status !== "COMPLETED" && days < 0;

  return (
    <div className="card group overflow-hidden transition-all hover:shadow-lift hover:-translate-y-0.5">
      <div
        className="relative h-32"
        style={{ background: `linear-gradient(135deg, ${a.book.coverColor} 0%, ${shadeColor(a.book.coverColor, -12)} 100%)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-20%,rgba(255,255,255,0.7),transparent)]" />
        <div className="absolute inset-x-5 inset-y-4 flex flex-col justify-between">
          <span className={`badge w-fit ${statusClasses(a.status)} backdrop-blur`}>
            {statusLabel(a.status)}
          </span>
          <div className="font-display text-lg font-semibold leading-tight text-stone-900">
            {a.book.title}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-stone-500">
          {a.book.author} · assigned by {a.teacher.name}
        </div>
        <p className="mt-2 text-sm text-stone-700 line-clamp-2">{a.book.summary}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5">
            <IconCalendar size={13} className="text-stone-400" />
            <div>
              <div className={`font-semibold ${overdue ? "text-brand-700" : "text-stone-800"}`}>
                {formatDate(a.dueDate)}
              </div>
              <div className="text-[10px] text-stone-500">
                {a.status === "COMPLETED"
                  ? "Completed"
                  : overdue
                  ? `${Math.abs(days)}d overdue`
                  : `in ${days} day${days === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5">
            <IconClock size={13} className="text-stone-400" />
            <div>
              <div className="font-semibold text-stone-800 tabular-nums">{a.minutesRead} min</div>
              <div className="text-[10px] text-stone-500">read so far</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Link to={`/student/assignments/${a.id}`} className="btn-primary text-sm">
            <IconPlay size={14} /> Open book
          </Link>
          <StatusSelect
            value={a.status}
            onChange={(s) => onStatusChange(a.id, s)}
            size="sm"
            aria-label="Update status"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-floaty p-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sunny-grad text-stone-900 shadow-soft">
        <IconBook size={22} />
      </div>
      <h2 className="display mt-4 text-2xl font-semibold text-stone-900">Nothing assigned yet</h2>
      <p className="mt-1 text-sm text-stone-600">
        Your teacher hasn&apos;t assigned anything. Check back later.
      </p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card overflow-hidden">
          <div className="h-32 bg-stone-200" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-stone-200" />
            <div className="h-3 w-2/3 rounded bg-stone-200" />
            <div className="h-8 w-1/2 rounded bg-stone-200 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Quick color darkening for the cover gradient — avoids pulling in chroma-js.
function shadeColor(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adj = (v: number) => Math.max(0, Math.min(255, Math.round(v + (v * percent) / 100)));
  return `#${[adj(r), adj(g), adj(b)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
