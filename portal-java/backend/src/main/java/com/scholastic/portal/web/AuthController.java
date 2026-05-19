package com.scholastic.portal.web;

import com.scholastic.portal.auth.AuthErrors;
import com.scholastic.portal.auth.CurrentUser;
import com.scholastic.portal.auth.CurrentUserArgumentResolver.AuthUser;
import com.scholastic.portal.auth.SessionService;
import com.scholastic.portal.domain.User;
import com.scholastic.portal.repo.UserRepository;
import com.scholastic.portal.web.dto.Dtos.LoginRequest;
import com.scholastic.portal.web.dto.Dtos.UserDto;
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
    private final String sameSite;

    public AuthController(UserRepository users, SessionService sessions,
                          @Value("${portal.cookie.secure:false}") boolean secureCookie,
                          @Value("${portal.cookie.same-site:Lax}") String sameSite) {
        this.users = users;
        this.sessions = sessions;
        this.secureCookie = secureCookie;
        this.sameSite = sameSite;
    }

    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest body, HttpServletResponse res) {
        User user = users.findByEmail(body.email().toLowerCase().trim())
            .orElseThrow(AuthErrors::unauthenticated);
        if (!encoder.matches(body.password(), user.getPasswordHash())) {
            // Same 401 for unknown email and wrong password — don't leak existence.
            throw AuthErrors.unauthenticated();
        }
        writeSessionCookie(res, sessions.issue(user.getId()), (int) sessions.getMaxAgeSeconds());
        return UserDto.from(user);
    }

    @PostMapping("/logout")
    public Object logout(HttpServletResponse res) {
        writeSessionCookie(res, "", 0);
        return java.util.Map.of("ok", true);
    }

    /**
     * Writes the session cookie with the configured Secure/SameSite values.
     * We bypass Cookie#toString and emit the Set-Cookie header directly because
     * Servlet's javax.servlet.http.Cookie still doesn't natively emit SameSite
     * on every container; this guarantees the attribute is present.
     */
    private void writeSessionCookie(HttpServletResponse res, String value, int maxAgeSeconds) {
        StringBuilder sb = new StringBuilder()
            .append(SessionService.COOKIE_NAME).append('=').append(value)
            .append("; Path=/")
            .append("; Max-Age=").append(maxAgeSeconds)
            .append("; HttpOnly")
            .append("; SameSite=").append(sameSite);
        if (secureCookie) sb.append("; Secure");
        res.addHeader("Set-Cookie", sb.toString());
    }

    /** Lets the SPA tell if there's still a valid session after a refresh. */
    @GetMapping("/me")
    public UserDto me(@AuthUser CurrentUser user) {
        return new UserDto(user.id(), user.email(), user.name(), user.role());
    }
}
