import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { IconLogout } from "./icons";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const home = user ? (user.role === "TEACHER" ? "/teacher" : "/student") : "/";

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/60 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to={home} className="flex items-center gap-2.5 group">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-grad text-white font-bold shadow-soft transition-transform group-hover:rotate-[-4deg]">
            R
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-sunny-400 ring-2 ring-white"></div>
          </div>
          <div className="leading-tight">
            <div className="display text-base font-semibold text-stone-900">Reading Portal</div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500">by Scholastic</div>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-white px-2 py-1 ring-1 ring-stone-200 shadow-soft">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-inner1
                  ${user.role === "TEACHER" ? "bg-ink-grad" : "bg-sunny-grad"}`}
                aria-hidden="true"
              >
                {initials(user.name)}
              </div>
              <div className="pr-1.5 text-sm">
                <div className="font-semibold text-stone-800 leading-tight">{user.name}</div>
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${user.role === "TEACHER" ? "text-ink-600" : "text-amber-600"}`}>
                  {user.role === "TEACHER" ? "Teacher" : "Student"}
                </div>
              </div>
            </div>
            <button
              className="btn-ghost px-3 py-1.5 text-sm"
              onClick={async () => {
                await logout();
                navigate("/", { replace: true });
              }}
              title="Sign out"
            >
              <IconLogout size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
