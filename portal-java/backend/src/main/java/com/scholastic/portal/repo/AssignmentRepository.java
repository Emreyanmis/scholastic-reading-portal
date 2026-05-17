package com.scholastic.portal.repo;

import com.scholastic.portal.domain.Assignment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, String> {

    // The list endpoint serializes the related Book/Teacher/Student onto every
    // assignment, so we eager-fetch them up front to avoid N+1 queries and
    // LazyInitializationException when open-in-view is off.
    @EntityGraph(attributePaths = { "book", "teacher", "student" })
    List<Assignment> findAllByTeacherIdOrderByDueDateAscCreatedAtDesc(String teacherId);

    @EntityGraph(attributePaths = { "book", "teacher", "student" })
    List<Assignment> findAllByStudentIdOrderByDueDateAscCreatedAtDesc(String studentId);
}
