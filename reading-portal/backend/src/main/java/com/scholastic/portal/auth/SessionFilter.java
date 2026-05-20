package com.scholastic.portal.auth;

import com.scholastic.portal.domain.User;
import com.scholastic.portal.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Servlet filter that pulls the user out of the session cookie and stashes a
 * {@link CurrentUser} on the request as the "currentUser" attribute. Controllers
 * read it via {@link CurrentUserArgumentResolver}.
 *
 * The filter is permissive: it doesn't reject requests. Authorization happens
 * at the controller level so each endpoint can be explicit about who can call it
 * (matches how the Next.js version handles this; keeps the wire format identical).
 */
@Component
public class SessionFilter extends OncePerRequestFilter {

    public static final String REQUEST_ATTR = "currentUser";

    private final SessionService sessions;
    private final UserRepository users;

    public SessionFilter(SessionService sessions, UserRepository users) {
        this.sessions = sessions;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        Optional<CurrentUser> user = readCookie(req)
            .map(sessions::verify)
            .filter(id -> id != null)
            .flatMap(users::findById)
            .map(CurrentUser::from);

        user.ifPresent(u -> req.setAttribute(REQUEST_ATTR, u));
        chain.doFilter(req, res);
    }

    private Optional<String> readCookie(HttpServletRequest req) {
        if (req.getCookies() == null) return Optional.empty();
        for (Cookie c : req.getCookies()) {
            if (SessionService.COOKIE_NAME.equals(c.getName())) {
                return Optional.ofNullable(c.getValue());
            }
        }
        return Optional.empty();
    }
}
