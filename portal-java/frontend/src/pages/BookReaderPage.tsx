import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, AssignmentStatus, BookFull, StudentDto, TeacherSummary } from "../lib/api";
import { BookReader } from "../components/BookReader";

type AssignmentDetail = {
  id: string;
  book: BookFull;
  teacher: TeacherSummary;
  student: StudentDto;
  dueDate: string;
  status: AssignmentStatus;
  minutesRead: number;
  completedAt: string | null;
};

export function BookReaderPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setDetail(await api.get<AssignmentDetail>(`/api/assignments/${id}`));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div className="space-y-3">
        <Link to="/student" className="text-sm text-zinc-600 hover:text-zinc-900">← Back to my reading</Link>
        <div className="text-brand-600">{error}</div>
      </div>
    );
  }
  if (!detail) return <div className="text-zinc-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <Link to="/student" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← Back to my reading
      </Link>
      <BookReader
        initial={{
          id: detail.id,
          status: detail.status,
          minutesRead: detail.minutesRead,
          dueDate: detail.dueDate,
          completedAt: detail.completedAt,
        }}
        book={detail.book}
        teacherName={detail.teacher.name}
        onChange={(patch) => setDetail((prev) => (prev ? { ...prev, ...patch } : prev))}
      />
    </div>
  );
}
