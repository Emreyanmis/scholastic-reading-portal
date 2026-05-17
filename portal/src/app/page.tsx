import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "TEACHER" ? "/teacher" : "/student");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Use one of the demo accounts below, or any seeded user.
        </p>
        <LoginForm />
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
