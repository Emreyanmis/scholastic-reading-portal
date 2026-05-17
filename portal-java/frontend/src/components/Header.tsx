import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const home = user ? (user.role === "TEACHER" ? "/teacher" : "/student") : "/";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to={home} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-brand-500 grid place-items-center text-white font-bold">R</div>
          <span className="font-semibold text-zinc-900">Reading Portal</span>
        </Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600">
              {user.name}{" "}
              <span className="badge bg-zinc-100 text-zinc-700 ml-1">
                {user.role === "TEACHER" ? "Teacher" : "Student"}
              </span>
            </span>
            <button
              className="btn-ghost text-zinc-600 hover:text-zinc-900"
              onClick={async () => {
                await logout();
                navigate("/", { replace: true });
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
