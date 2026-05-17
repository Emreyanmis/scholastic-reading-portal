package com.scholastic.portal.web;

import com.scholastic.portal.auth.AuthErrors;
import com.scholastic.portal.auth.CurrentUser;
import com.scholastic.portal.auth.CurrentUserArgumentResolver.AuthUser;
import com.scholastic.portal.auth.SessionService;
import com.scholastic.portal.domain.User;
import com.scholastic.portal.repo.UserRepository;
import com.scholastic.portal.web.dto.Dtos.LoginRequest;
import com.scholastic.portal.web.dto.Dtos.UserDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final SessionService sessions;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final boolean secureCookie;

    public AuthController(UserRepository users, SessionService sessions,
                          @Value("${portal.cookie.secure:false}") boolean secureCookie) {
        this.users = users;
        this.sessions = sessions;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest body, HttpServletResponse res) {
        User user = users.findByEmail(body.email().toLowerCase().trim())
            .orElseThrow(AuthErrors::unauthenticated);
        if (!encoder.matches(body.password(), user.getPasswordHash())) {
            // Same 401 for unknown email and wrong password — don't leak existence.
            throw AuthErrors.unauthenticated();
        }
        String token = sessions.issue(user.getId());
        Cookie cookie = new Cookie(SessionService.COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) sessions.getMaxAgeSeconds());
        cookie.setSecure(secureCookie);
        cookie.setAttribute("SameSite", "Lax");
        res.addCookie(cookie);
        return UserDto.from(user);
    }

    @PostMapping("/logout")
    public Object logout(HttpServletResponse res) {
        Cookie cookie = new Cookie(SessionService.COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setSecure(secureCookie);
        res.addCookie(cookie);
        return java.util.Map.of("ok", true);
    }

    /** Lets the SPA tell if there's still a valid session after a refresh. */
    @GetMapping("/me")
    public UserDto me(@AuthUser CurrentUser user) {
        return new UserDto(user.id(), user.email(), user.name(), user.role());
    }
}
