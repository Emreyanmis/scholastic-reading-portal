import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

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

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">Use one of the demo accounts below.</p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-zinc-700">Email</label>
            <input
              className="input mt-1"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Password</label>
            <input
              className="input mt-1"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="text-sm text-brand-600">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          <div className="font-medium text-zinc-800 mb-1">Demo credentials</div>
          <div>Teacher — <code>teacher@demo.com</code> / <code>teacher123</code></div>
          <div>Student — <code>alex@demo.com</code> / <code>student123</code></div>
          <div>Student — <code>jordan@demo.com</code> / <code>student123</code></div>
        </div>
      </div>
    </div>
  );
}
