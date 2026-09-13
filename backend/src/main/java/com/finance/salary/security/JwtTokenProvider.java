package com.finance.salary.security;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class JwtTokenProvider {

    private static final String ALGORITHM = "HmacSHA256";
    private static final Pattern SUBJECT = Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]*)\"");
    private static final Pattern EXPIRY = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");

    private final UserDetailsService userDetailsService;

    @Value("${app.jwt.secret:}")
    private String secret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long validityInMs;

    private byte[] secretKeyBytes;

    public JwtTokenProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @PostConstruct
    public void init() {
        if (secret == null || secret.isBlank()) {
            byte[] bytes = new byte[32];
            new Random().nextBytes(bytes);
            secretKeyBytes = bytes;
            log.warn("JWT secret (app.jwt.secret / APP_JWT_SECRET) is not configured; using a random per-startup secret (dev only).");
        } else {
            secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
            if (secretKeyBytes.length < 32) {
                log.warn("Configured JWT secret is shorter than 32 bytes; consider using a longer secret for production.");
            }
        }
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_USER");

        long now = System.currentTimeMillis();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", username);
        payload.put("role", role);
        payload.put("iat", now);
        payload.put("exp", now + validityInMs);

        String headerB64 = base64UrlEncode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payloadB64 = base64UrlEncode(toJson(payload).getBytes(StandardCharsets.UTF_8));
        String signingInput = headerB64 + "." + payloadB64;
        String signature = base64UrlEncode(sign(signingInput));
        return signingInput + "." + signature;
    }

    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;
            String signingInput = parts[0] + "." + parts[1];
            byte[] providedSignature = base64UrlDecode(parts[2]);
            byte[] expectedSignature = sign(signingInput);
            if (!MessageDigest.isEqual(providedSignature, expectedSignature)) return false;
            Matcher exp = EXPIRY.matcher(new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8));
            return exp.find() && System.currentTimeMillis() <= Long.parseLong(exp.group(1));
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String getUsername(String token) {
        try {
            String payloadJson = new String(base64UrlDecode(token.split("\\.")[1]), StandardCharsets.UTF_8);
            Matcher matcher = SUBJECT.matcher(payloadJson);
            if (matcher.find()) return matcher.group(1);
            throw new IllegalArgumentException("Subject claim not found");
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not extract username from JWT", e);
        }
    }

    public Authentication getAuthentication(String token) {
        String username = getUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }

    private byte[] sign(String data) {
        try {
            SecretKeySpec key = new SecretKeySpec(secretKeyBytes, ALGORITHM);
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign JWT", e);
        }
    }

    private static String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append('"').append(escapeJson(entry.getKey())).append("\":");
            Object value = entry.getValue();
            if (value instanceof String s) {
                sb.append('"').append(escapeJson(s)).append('"');
            } else {
                sb.append(value);
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length() + 2);
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                default:
                    sb.append(c < 0x20 ? String.format("\\u%04x", (int) c) : c);
            }
        }
        return sb.toString();
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] base64UrlDecode(String s) {
        return Base64.getUrlDecoder().decode(s);
    }
}
