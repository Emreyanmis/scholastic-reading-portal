package com.scholastic.portal.web;

import com.scholastic.portal.auth.CurrentUser;
import com.scholastic.portal.auth.CurrentUserArgumentResolver.AuthUser;
import com.scholastic.portal.repo.BookRepository;
import com.scholastic.portal.web.dto.Dtos.BookSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookRepository books;

    public BookController(BookRepository books) {
        this.books = books;
    }

    @GetMapping
    public List<BookSummary> list(@AuthUser CurrentUser user) {
        return books.findAllByOrderByTitleAsc().stream().map(BookSummary::from).toList();
    }
}
