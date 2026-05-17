import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { useAuth } from "./lib/auth";
import { LoginPage } from "./pages/LoginPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { BookReaderPage } from "./pages/BookReaderPage";
import type { Role } from "./lib/api";

function RequireRole({ role, children }: { role: Role; children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8 text-zinc-500">Loading…</div>;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (user.role !== role) return <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <div className="p-8 text-zinc-500">Loading…</div>
              ) : user ? (
                <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/teacher"
            element={
              <RequireRole role="TEACHER">
                <TeacherDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/student"
            element={
              <RequireRole role="STUDENT">
                <StudentDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/student/assignments/:id"
            element={
              <RequireRole role="STUDENT">
                <BookReaderPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
