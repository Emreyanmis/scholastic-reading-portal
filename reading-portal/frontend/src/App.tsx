import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { PageSkeleton } from "./components/PageSkeleton";
import { useAuth } from "./lib/auth";
import { LoginPage } from "./pages/LoginPage";
import type { Role } from "./lib/api";

const TeacherDashboardPage = lazy(() =>
  import("./pages/TeacherDashboardPage").then((m) => ({ default: m.TeacherDashboardPage }))
);
const StudentDashboardPage = lazy(() =>
  import("./pages/StudentDashboardPage").then((m) => ({ default: m.StudentDashboardPage }))
);
const BookReaderPage = lazy(() =>
  import("./pages/BookReaderPage").then((m) => ({ default: m.BookReaderPage }))
);

function RequireRole({ role, children }: { role: Role; children: JSX.Element }) {
  const { user, sessionChecked } = useAuth();
  const location = useLocation();

  if (!sessionChecked && !user) return <PageSkeleton />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (user.role !== role) return <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace />;

  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
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
