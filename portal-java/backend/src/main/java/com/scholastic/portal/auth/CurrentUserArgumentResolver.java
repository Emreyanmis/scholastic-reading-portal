package com.scholastic.portal.auth;

import com.scholastic.portal.domain.Role;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Binds a {@link CurrentUser} into controller method parameters. Use as:
 *
 *   public Object handler(@AuthUser CurrentUser user) { ... }
 *
 * If `requiredRole` is set, the resolver enforces it. If no user is on the
 * request, it throws 401. Wrong role throws 403. Controllers don't have to
 * sprinkle if/else gates around authentication anymore.
 */
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Target(ElementType.PARAMETER)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface AuthUser {
        Role requiredRole() default Role.STUDENT; // default is overridden by `any`
        boolean any() default true;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(AuthUser.class)
            && parameter.getParameterType() == CurrentUser.class;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest req = webRequest.getNativeRequest(HttpServletRequest.class);
        if (req == null) throw AuthErrors.unauthenticated();
        Object attr = req.getAttribute(SessionFilter.REQUEST_ATTR);
        if (!(attr instanceof CurrentUser user)) throw AuthErrors.unauthenticated();

        AuthUser ann = parameter.getParameterAnnotation(AuthUser.class);
        if (ann != null && !ann.any() && user.role() != ann.requiredRole()) {
            throw AuthErrors.forbidden();
        }
        return user;
    }
}
