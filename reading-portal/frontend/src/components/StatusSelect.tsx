import { useEffect, useId, useRef, useState } from "react";
import type { AssignmentStatus } from "../lib/api";
import { statusClasses, statusLabel } from "../lib/format";
import { IconCheck } from "./icons";

const OPTIONS: AssignmentStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

type Props = {
  value: AssignmentStatus;
  onChange: (status: AssignmentStatus) => void;
  disabled?: boolean;
  /** Compact trigger for assignment cards; full width in the book reader sidebar. */
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
};

export function StatusSelect({
  value,
  onChange,
  disabled,
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Assignment status",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: AssignmentStatus) {
    setOpen(false);
    if (next !== value) onChange(next);
  }

  const triggerMd =
    "mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-soft transition hover:border-stone-300 hover:bg-stone-50";
  const triggerSm =
    "inline-flex min-w-[9.5rem] items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs shadow-soft transition hover:border-stone-300 hover:bg-stone-50";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`${size === "md" ? triggerMd : triggerSm} disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={`badge shrink-0 ${statusClasses(value)}`}>{statusLabel(value)}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-20 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-lift ring-1 ring-stone-900/5 animate-fade-in
            ${size === "md" ? "left-0 right-0 top-full mt-1.5" : "right-0 top-full mt-1.5 w-52"}`}
        >
          {OPTIONS.map((opt) => {
            const selected = opt === value;
            return (
              <li key={opt} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition
                    ${selected ? "bg-stone-50 ring-1 ring-stone-200/80" : "hover:bg-stone-50"}`}
                  onClick={() => pick(opt)}
                >
                  <span className={`badge ${statusClasses(opt)}`}>{statusLabel(opt)}</span>
                  {selected && (
                    <IconCheck size={14} className="ml-auto shrink-0 text-brand-600" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
