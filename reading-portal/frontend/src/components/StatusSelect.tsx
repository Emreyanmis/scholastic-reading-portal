import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AssignmentStatus } from "../lib/api";
import { statusClasses, statusLabel } from "../lib/format";
import { IconCheck } from "./icons";

const OPTIONS: AssignmentStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
const MENU_GAP = 6;
const MENU_WIDTH_SM = 208;

type Props = {
  value: AssignmentStatus;
  onChange: (status: AssignmentStatus) => void;
  disabled?: boolean;
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  function placeMenu() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuHeight = menuEl?.offsetHeight ?? 132;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = size === "sm" || spaceBelow < menuHeight + MENU_GAP + 8;
    const width = size === "md" ? rect.width : MENU_WIDTH_SM;
    const left = size === "md" ? rect.left : rect.right - width;

    setMenuPos({
      top: openUp ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
      left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
      width,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    placeMenu();
    const id = requestAnimationFrame(placeMenu);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open, size]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
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

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lift ring-1 ring-stone-900/5 animate-fade-in"
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
          </ul>,
          document.body
        )
      : null;

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        className={`${size === "md" ? triggerMd : triggerSm} disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          if (open) {
            setOpen(false);
            return;
          }
          placeMenu();
          setOpen(true);
        }}
      >
        <span className={`badge shrink-0 ${statusClasses(value)}`}>{statusLabel(value)}</span>
        <Chevron open={open} />
      </button>
      {menu}
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
