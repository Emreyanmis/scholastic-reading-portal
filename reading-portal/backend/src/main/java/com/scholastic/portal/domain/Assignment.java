package com.scholastic.portal.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "assignments",
    indexes = {
        @Index(name = "idx_assignment_teacher", columnList = "teacher_id"),
        @Index(name = "idx_assignment_student", columnList = "student_id")
    }
)
public class Assignment {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private Instant dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private AssignmentStatus status;

    /**
     * Materialized total minutes read across all ReadingSession rows. We bump
     * this inside the same transaction as inserting a session row so the
     * teacher dashboard can render without an aggregate query.
     */
    @Column(nullable = false)
    private int minutesRead;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant completedAt;

    protected Assignment() {
        // JPA
    }

    public Assignment(Book book, User teacher, User student, Instant dueDate) {
        this.id = UUID.randomUUID().toString();
        this.book = book;
        this.teacher = teacher;
        this.student = student;
        this.dueDate = dueDate;
        this.status = AssignmentStatus.NOT_STARTED;
        this.minutesRead = 0;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void setStatus(AssignmentStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
        this.completedAt = status == AssignmentStatus.COMPLETED ? Instant.now() : null;
    }

    public void addMinutes(int minutes) {
        this.minutesRead += minutes;
        if (this.status == AssignmentStatus.NOT_STARTED) {
            this.status = AssignmentStatus.IN_PROGRESS;
        }
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public Book getBook() { return book; }
    public User getTeacher() { return teacher; }
    public User getStudent() { return student; }
    public Instant getDueDate() { return dueDate; }
    public AssignmentStatus getStatus() { return status; }
    public int getMinutesRead() { return minutesRead; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getCompletedAt() { return completedAt; }

    // Test-only seeding shortcuts.
    public void seedMinutes(int minutes) { this.minutesRead = minutes; }
    public void seedStatus(AssignmentStatus s) { this.status = s; this.updatedAt = Instant.now(); }
}
