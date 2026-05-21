import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError, isTimeoutError } from "../lib/api";
import { BookCover } from "../components/BookCover";
import { IconEye, IconEyeOff, IconSparkle } from "../components/icons";
import { ScholasticLogo } from "../components/ScholasticLogo";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [waking, setWaking] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setWaking(true);
    try {
      const me = await login(email, password);
      navigate(me.role === "TEACHER" ? "/teacher" : "/student", { replace: true });
    } catch (err) {
      if (isTimeoutError(err)) {
        setError("The server is still starting (free hosting). Wait ~30 seconds, then click Sign in again.");
      } else {
        setError(err instanceof ApiError ? err.message : "Login failed");
      }
    } finally {
      setBusy(false);
      setWaking(false);
    }
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
          <div className="flex flex-col gap-3">
            <ScholasticLogo className="h-10 w-auto max-w-[11rem]" />
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
              <div className="relative mt-1.5">
                <input
                  className="input pr-11"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-100">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
              {waking ? "Starting server…" : busy ? "Signing in…" : "Sign in"}
            </button>
            {waking && (
              <p className="text-center text-xs text-stone-500">
                First visit after idle can take up to a minute on free hosting.
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
