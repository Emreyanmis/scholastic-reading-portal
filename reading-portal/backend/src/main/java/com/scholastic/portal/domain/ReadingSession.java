package com.scholastic.portal.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "reading_sessions",
    indexes = @Index(name = "idx_session_assignment", columnList = "assignment_id")
)
public class ReadingSession {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false)
    private int minutes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ReadingSession() {
        // JPA
    }

    public ReadingSession(Assignment assignment, int minutes) {
        this.id = UUID.randomUUID().toString();
        this.assignment = assignment;
        this.minutes = minutes;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public Assignment getAssignment() { return assignment; }
    public int getMinutes() { return minutes; }
    public Instant getCreatedAt() { return createdAt; }
}
