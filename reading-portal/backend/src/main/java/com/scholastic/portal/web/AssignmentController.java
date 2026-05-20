package com.scholastic.portal.web;

import com.scholastic.portal.auth.AuthErrors;
import com.scholastic.portal.auth.CurrentUser;
import com.scholastic.portal.auth.CurrentUserArgumentResolver.AuthUser;
import com.scholastic.portal.domain.Assignment;
import com.scholastic.portal.domain.Book;
import com.scholastic.portal.domain.Role;
import com.scholastic.portal.domain.User;
import com.scholastic.portal.domain.ReadingSession;
import com.scholastic.portal.repo.AssignmentRepository;
import com.scholastic.portal.repo.BookRepository;
import com.scholastic.portal.repo.ReadingSessionRepository;
import com.scholastic.portal.repo.UserRepository;
import com.scholastic.portal.web.dto.Dtos.AssignmentDetailDto;
import com.scholastic.portal.web.dto.Dtos.AssignmentDto;
import com.scholastic.portal.web.dto.Dtos.CreateAssignmentRequest;
import com.scholastic.portal.web.dto.Dtos.CreateAssignmentResponse;
import com.scholastic.portal.web.dto.Dtos.LogSessionRequest;
import com.scholastic.portal.web.dto.Dtos.UpdateStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentRepository assignments;
    private final BookRepository books;
    private final UserRepository users;
    private final ReadingSessionRepository sessions;

    public AssignmentController(AssignmentRepository assignments,
                                BookRepository books,
                                UserRepository users,
                                ReadingSessionRepository sessions) {
        this.assignments = assignments;
        this.books = books;
        this.users = users;
        this.sessions = sessions;
    }

    /**
     * Teachers: returns assignments they created.
     * Students: returns assignments assigned to them.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public List<AssignmentDto> list(@AuthUser CurrentUser user) {
        List<Assignment> rows = user.role() == Role.TEACHER
            ? assignments.findAllByTeacherIdOrderByDueDateAscCreatedAtDesc(user.id())
            : assignments.findAllByStudentIdOrderByDueDateAscCreatedAtDesc(user.id());
        return rows.stream().map(AssignmentDto::from).toList();
    }

    @PostMapping
    @Transactional
    public CreateAssignmentResponse create(
        @AuthUser(requiredRole = Role.TEACHER, any = false) CurrentUser teacherUser,
        @Valid @RequestBody CreateAssignmentRequest body
    ) {
        Book book = books.findById(body.bookId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        List<User> students = users.findAllById(body.studentIds());
        if (students.size() != body.studentIds().size()
            || students.stream().anyMatch(s -> s.getRole() != Role.STUDENT)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more students not found");
        }

        User teacher = users.findById(teacherUser.id())
            .orElseThrow(AuthErrors::unauthenticated);

        // We don't enforce uniqueness on (student, book) — re-assigning is a
        // legitimate workflow (re-reads, summer reviews).
        List<Assignment> created = students.stream()
            .map(s -> assignments.save(new Assignment(book, teacher, s, body.dueDate())))
            .toList();

        return new CreateAssignmentResponse(
            created.size(),
            created.stream().map(AssignmentDto::from).toList()
        );
    }

    /** Single-assignment detail with full book content (for the in-app reader). */
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public AssignmentDetailDto detail(@AuthUser CurrentUser user, @PathVariable String id) {
        Assignment a = assignments.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        // Students can only see their own; teachers can see any they assigned.
        boolean ownStudent = user.role() == Role.STUDENT && a.getStudent().getId().equals(user.id());
        boolean ownTeacher = user.role() == Role.TEACHER && a.getTeacher().getId().equals(user.id());
        if (!ownStudent && !ownTeacher) {
            // Don't leak existence — mirror the Next.js version's behaviour.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found");
        }
        return AssignmentDetailDto.from(a);
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public AssignmentDto updateStatus(
        @AuthUser(requiredRole = Role.STUDENT, any = false) CurrentUser student,
        @PathVariable String id,
        @Valid @RequestBody UpdateStatusRequest body
    ) {
        Assignment a = findOwned(id, student.id());
        a.setStatus(body.status());
        return AssignmentDto.from(a);
    }

    @PostMapping("/{id}/sessions")
    @Transactional
    public AssignmentDto logSession(
        @AuthUser(requiredRole = Role.STUDENT, any = false) CurrentUser student,
        @PathVariable String id,
        @Valid @RequestBody LogSessionRequest body
    ) {
        Assignment a = findOwned(id, student.id());
        sessions.save(new ReadingSession(a, body.minutes()));
        a.addMinutes(body.minutes());
        return AssignmentDto.from(a);
    }

    private Assignment findOwned(String id, String studentId) {
        Assignment a = assignments.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        if (!a.getStudent().getId().equals(studentId)) {
            throw AuthErrors.forbidden();
        }
        return a;
    }
}
