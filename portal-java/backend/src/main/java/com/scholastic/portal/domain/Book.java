package com.scholastic.portal.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false, length = 32)
    private String coverColor;

    @Column(length = 64)
    private String gradeLevel;

    @Lob
    @Column(nullable = false, columnDefinition = "CLOB")
    private String summary;

    /**
     * Body text rendered in the in-app reader. Stored as CLOB so a real book
     * could fit; in a production system this would be a reference to object
     * storage (S3) for PDFs/EPUBs.
     */
    @Lob
    @Column(nullable = false, columnDefinition = "CLOB")
    private String content;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Book() {
        // JPA
    }

    public Book(String title, String author, String coverColor, String gradeLevel,
                String summary, String content) {
        this.id = UUID.randomUUID().toString();
        this.title = title;
        this.author = author;
        this.coverColor = coverColor;
        this.gradeLevel = gradeLevel;
        this.summary = summary;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getCoverColor() { return coverColor; }
    public String getGradeLevel() { return gradeLevel; }
    public String getSummary() { return summary; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
