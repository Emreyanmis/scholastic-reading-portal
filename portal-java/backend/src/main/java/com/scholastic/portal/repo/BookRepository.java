package com.scholastic.portal.repo;

import com.scholastic.portal.domain.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, String> {
    List<Book> findAllByOrderByTitleAsc();
}
