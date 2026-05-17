package com.scholastic.portal.web;

import com.scholastic.portal.auth.CurrentUser;
import com.scholastic.portal.auth.CurrentUserArgumentResolver.AuthUser;
import com.scholastic.portal.domain.Role;
import com.scholastic.portal.repo.UserRepository;
import com.scholastic.portal.web.dto.Dtos.StudentDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final UserRepository users;

    public StudentController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    public List<StudentDto> list(@AuthUser(requiredRole = Role.TEACHER, any = false) CurrentUser user) {
        return users.findAllByRoleOrderByNameAsc(Role.STUDENT).stream()
            .map(StudentDto::from).toList();
    }
}
