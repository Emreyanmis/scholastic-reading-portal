import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, AssignmentStatus, BookFull, DATA_LOAD_OPTS, loadErrorMessage, StudentDto, TeacherSummary } from "../lib/api";
import { BookReader } from "../components/BookReader";
import { PageSkeleton } from "../components/PageSkeleton";
import { IconArrowLeft } from "../components/icons";

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
        setDetail(await api.get<AssignmentDetail>(`/api/assignments/${id}`, DATA_LOAD_OPTS));
      } catch (e) {
        setError(loadErrorMessage(e));
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div className="space-y-3">
        <BackLink />
        <div className="card p-6 text-brand-700 bg-brand-50">{error}</div>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="space-y-4">
        <BackLink />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <BackLink />
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

function BackLink() {
  return (
    <Link
      to="/student"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900"
    >
      <IconArrowLeft size={14} /> Back to my reading
    </Link>
  );
}
