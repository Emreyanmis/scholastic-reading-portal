package com.scholastic.portal.auth;

import com.scholastic.portal.domain.Role;
import com.scholastic.portal.domain.User;

public record CurrentUser(String id, String email, String name, Role role) {
    public static CurrentUser from(User u) {
        return new CurrentUser(u.getId(), u.getEmail(), u.getName(), u.getRole());
    }
}
