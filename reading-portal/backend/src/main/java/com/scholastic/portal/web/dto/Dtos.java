package com.scholastic.portal.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.scholastic.portal.domain.Assignment;
import com.scholastic.portal.domain.AssignmentStatus;
import com.scholastic.portal.domain.Book;
import com.scholastic.portal.domain.Role;
import com.scholastic.portal.domain.User;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;

import java.time.Instant;
import java.util.List;

/**
 * Wire types. Kept together so the API contract is easy to read at a glance.
 * Field names are exactly the ones the React frontend expects and match the
 * Next.js implementation, so we can ship the same frontend code if needed.
 */
public final class Dtos {
    private Dtos() {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record UserDto(String id, String email, String name, Role role) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getEmail(), u.getName(), u.getRole());
        }
    }

    public record StudentDto(String id, String name, String email) {
        public static StudentDto from(User u) {
            return new StudentDto(u.getId(), u.getName(), u.getEmail());
        }
    }

    public record BookSummary(String id, String title, String author, String coverColor,
                              String summary, String gradeLevel) {
        public static BookSummary from(Book b) {
            return new BookSummary(b.getId(), b.getTitle(), b.getAuthor(),
                b.getCoverColor(), b.getSummary(), b.getGradeLevel());
        }
    }

    public record BookFull(String id, String title, String author, String coverColor,
                           String summary, String content, String gradeLevel) {
        public static BookFull from(Book b) {
            return new BookFull(b.getId(), b.getTitle(), b.getAuthor(),
                b.getCoverColor(), b.getSummary(), b.getContent(), b.getGradeLevel());
        }
    }

    public record TeacherSummary(String id, String name) {
        public static TeacherSummary from(User u) {
            return new TeacherSummary(u.getId(), u.getName());
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AssignmentDto(
        String id,
        String bookId,
        BookSummary book,
        String teacherId,
        TeacherSummary teacher,
        String studentId,
        StudentDto student,
        Instant dueDate,
        AssignmentStatus status,
        int minutesRead,
        Instant createdAt,
        Instant updatedAt,
        Instant completedAt
    ) {
        public static AssignmentDto from(Assignment a) {
            return new AssignmentDto(
                a.getId(),
                a.getBook().getId(),
                BookSummary.from(a.getBook()),
                a.getTeacher().getId(),
                TeacherSummary.from(a.getTeacher()),
                a.getStudent().getId(),
                StudentDto.from(a.getStudent()),
                a.getDueDate(),
                a.getStatus(),
                a.getMinutesRead(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                a.getCompletedAt()
            );
        }
    }

    /**
     * Detail view used by the in-app reader. Includes the full book content,
     * which we keep off the list endpoint to avoid shipping book bodies on
     * every dashboard load.
     */
    public record AssignmentDetailDto(
        String id,
        BookFull book,
        TeacherSummary teacher,
        StudentDto student,
        Instant dueDate,
        AssignmentStatus status,
        int minutesRead,
        Instant completedAt
    ) {
        public static AssignmentDetailDto from(com.scholastic.portal.domain.Assignment a) {
            return new AssignmentDetailDto(
                a.getId(),
                BookFull.from(a.getBook()),
                TeacherSummary.from(a.getTeacher()),
                StudentDto.from(a.getStudent()),
                a.getDueDate(),
                a.getStatus(),
                a.getMinutesRead(),
                a.getCompletedAt()
            );
        }
    }

    public record CreateAssignmentRequest(
        @NotBlank String bookId,
        @NotEmpty List<@NotBlank String> studentIds,
        @NotNull Instant dueDate
    ) {}

    public record CreateAssignmentResponse(int created, List<AssignmentDto> assignments) {}

    public record UpdateStatusRequest(@NotNull AssignmentStatus status) {}

    public record LogSessionRequest(@Min(1) @Max(600) int minutes) {}
}
