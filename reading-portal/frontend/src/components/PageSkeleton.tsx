/** Lightweight placeholder while lazy routes or session check load. */
export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden>
      <div className="h-8 w-48 rounded-lg bg-stone-200" />
      <div className="h-4 w-72 max-w-full rounded bg-stone-100" />
      <div className="card h-40" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card h-32" />
        <div className="card h-32" />
      </div>
    </div>
  );
}
