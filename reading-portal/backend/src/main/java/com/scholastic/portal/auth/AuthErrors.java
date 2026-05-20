package com.scholastic.portal.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AuthErrors {
    private AuthErrors() {}

    public static ResponseStatusException unauthenticated() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }

    public static ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
}
