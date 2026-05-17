import type { Metadata } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Reading Portal",
  description: "Teacher reading assignment portal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href={user ? (user.role === "TEACHER" ? "/teacher" : "/student") : "/"} className="flex items-center gap-2">
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
                <LogoutButton />
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
