package com.scholastic.portal.config;

import com.scholastic.portal.auth.CurrentUserArgumentResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserResolver;
    private final String allowedOrigins;

    public WebConfig(CurrentUserArgumentResolver currentUserResolver,
                     @Value("${portal.cors.allowed-origins}") String allowedOrigins) {
        this.currentUserResolver = currentUserResolver;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserResolver);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split("\\s*,\\s*");
        registry.addMapping("/api/**")
            .allowedOrigins(origins)
            .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            // Required for the frontend to receive Set-Cookie / send cookies cross-origin.
            .allowCredentials(true)
            .maxAge(3600);
    }
}
