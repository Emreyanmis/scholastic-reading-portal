package com.scholastic.portal.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Tiny signed-cookie session implementation. The cookie payload is
 *   {userId}.{issuedAtMillis}.{nonce}
 * with an HMAC-SHA256 signature appended:
 *   {userId}.{issuedAt}.{nonce}.{hexSignature}
 *
 * I'd swap this for Spring Security with a real session store before
 * production, but the surface area is tiny and easy to reason about for a demo.
 * The signing/verification is constant-time and uses MessageDigest.isEqual.
 */
@Service
public class SessionService {

    public static final String COOKIE_NAME = "rp_session";

    private final byte[] secret;
    private final long maxAgeSeconds;
    private final SecureRandom random = new SecureRandom();

    public SessionService(
        @Value("${portal.session.secret}") String secret,
        @Value("${portal.session.max-age-seconds:604800}") long maxAgeSeconds
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("portal.session.secret must be set");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.maxAgeSeconds = maxAgeSeconds;
    }

    public long getMaxAgeSeconds() {
        return maxAgeSeconds;
    }

    public String issue(String userId) {
        byte[] nonceBytes = new byte[8];
        random.nextBytes(nonceBytes);
        String nonce = HexFormat.of().formatHex(nonceBytes);
        String payload = userId + "." + System.currentTimeMillis() + "." + nonce;
        String sig = sign(payload);
        return payload + "." + sig;
    }

    /** @return user id if the token is valid and unexpired, else null. */
    public String verify(String token) {
        if (token == null) return null;
        String[] parts = token.split("\\.");
        if (parts.length != 4) return null;
        String payload = parts[0] + "." + parts[1] + "." + parts[2];
        String expected = sign(payload);
        if (!constantTimeEquals(expected, parts[3])) return null;
        long issuedAt;
        try {
            issuedAt = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            return null;
        }
        if (System.currentTimeMillis() - issuedAt > maxAgeSeconds * 1000L) return null;
        return parts[0];
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] sig = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(sig);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
            a.getBytes(StandardCharsets.UTF_8),
            b.getBytes(StandardCharsets.UTF_8)
        );
    }
}
