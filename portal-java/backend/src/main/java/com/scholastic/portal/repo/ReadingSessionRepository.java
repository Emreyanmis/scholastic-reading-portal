package com.scholastic.portal.repo;

import com.scholastic.portal.domain.ReadingSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, String> {
}
