package com.finance.salary.service;

import com.finance.salary.entity.Session;
import com.finance.salary.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final long sessionTtlSeconds;
    private final SecureRandom random = new SecureRandom();

    public SessionService(SessionRepository sessionRepository,
                         @Value("${app.session.ttl-seconds:86400}") long sessionTtlSeconds) {
        this.sessionRepository = sessionRepository;
        this.sessionTtlSeconds = sessionTtlSeconds;
    }

    public Session createSession(String username, String role, String ipAddress) {
        String sessionId = generateSessionId();
        LocalDateTime now = LocalDateTime.now();
        Session session = new Session();
        session.setSessionId(sessionId);
        session.setUsername(username);
        session.setRole(role);
        session.setIpAddress(ipAddress);
        session.setCreatedAt(now);
        session.setExpiresAt(now.plusSeconds(sessionTtlSeconds));
        return sessionRepository.save(session);
    }

    public Optional<Session> validateSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Optional.empty();
        }
        return sessionRepository.findBySessionIdAndExpiresAtAfter(sessionId, LocalDateTime.now());
    }

    public void deleteSession(String sessionId) {
        if (sessionId != null) {
            sessionRepository.deleteById(sessionId);
        }
    }

    public void deleteAllUserSessions(String username) {
        sessionRepository.deleteByUsername(username);
    }

    @Scheduled(fixedRateString = "${app.session.cleanup-interval-ms:600000}")
    public void cleanupExpiredSessions() {
        sessionRepository.deleteAll(sessionRepository.findByExpiresAtBefore(LocalDateTime.now()));
    }

    private String generateSessionId() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
