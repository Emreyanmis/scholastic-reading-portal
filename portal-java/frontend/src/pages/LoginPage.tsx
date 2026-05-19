import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { BookCover } from "../components/BookCover";
import { IconSparkle } from "../components/icons";

const DEMO = [
  { role: "Teacher", email: "teacher@demo.com", password: "teacher123" },
  { role: "Student", email: "alex@demo.com",    password: "student123" },
  { role: "Student", email: "jordan@demo.com",  password: "student123" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const me = await login(email, password);
      navigate(me.role === "TEACHER" ? "/teacher" : "/student", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function fill(d: typeof DEMO[number]) {
    setEmail(d.email);
    setPassword(d.password);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10 items-center animate-fade-in">
      {/* Hero ---------------------------------------------------------- */}
      <aside className="hidden lg:block">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 shadow-soft">
            <IconSparkle size={14} /> A reading portal teachers &amp; kids will actually use
          </div>
          <h1 className="display mt-4 text-5xl font-bold text-stone-900 leading-[1.05]">
            Assign reading.<br />
            <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 bg-clip-text text-transparent">
              Track every minute.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base text-stone-600">
            Pick a book, set a due date, and watch your class fly through it. Students read in
            the browser and log their time as they go.
          </p>

          {/* Decorative book stack */}
          <div className="relative mt-10 h-56">
            <div className="absolute left-2 top-6 rotate-[-8deg] animate-float">
              <BookCover title="The Lighthouse on Maple Street" author="A. Quinn" color="#fde68a" size="lg" />
            </div>
            <div className="absolute left-28 top-0 rotate-[4deg] animate-float [animation-delay:600ms]">
              <BookCover title="Migrations" author="R. Okafor" color="#bae6fd" size="lg" />
            </div>
            <div className="absolute left-56 top-10 rotate-[-3deg] animate-float [animation-delay:1200ms]">
              <BookCover title="How Computers Dream" author="T. Alvarez" color="#ddd6fe" size="lg" />
            </div>
            <div className="absolute left-[19rem] top-2 rotate-[7deg] animate-float [animation-delay:1800ms]">
              <BookCover title="Atlas of Tiny Kingdoms" author="P. Liang" color="#fbcfe8" size="lg" />
            </div>
          </div>
        </div>
      </aside>

      {/* Sign in card -------------------------------------------------- */}
      <section className="mx-auto w-full max-w-md">
        <div className="card-floaty p-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-grad text-white font-bold shadow-soft">
              R
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Reading Portal</div>
              <div className="display text-xl font-semibold text-stone-900">Welcome back</div>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="label">Email</label>
              <input
                className="input mt-1.5"
                type="email"
                placeholder="you@school.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input mt-1.5"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-100">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-cream-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Demo accounts
              </div>
              <div className="text-[10px] text-stone-400">click to fill</div>
            </div>
            <div className="mt-2 grid gap-1.5">
              {DEMO.map((d) => (
                <button
                  type="button"
                  key={d.email}
                  onClick={() => fill(d)}
                  className="group flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-xs ring-1 ring-stone-200 hover:ring-brand-300 hover:bg-brand-50/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <span className={`badge ${d.role === "Teacher" ? "bg-ink-100 text-ink-700" : "bg-sunny-100 text-amber-700"}`}>
                      {d.role}
                    </span>
                    <code className="text-stone-700">{d.email}</code>
                  </span>
                  <code className="text-stone-400 group-hover:text-stone-600">{d.password}</code>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
