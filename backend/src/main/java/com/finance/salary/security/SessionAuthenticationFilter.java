package com.finance.salary.security;

import com.finance.salary.entity.Session;
import com.finance.salary.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionService sessionService;

    public SessionAuthenticationFilter(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String sessionId = resolveSessionId(request);
        if (sessionId != null) {
            log.debug("Session ID from header: {}...", sessionId.substring(0, Math.min(20, sessionId.length())));
            try {
                var sessionOpt = sessionService.validateSession(sessionId);
                if (sessionOpt.isPresent()) {
                    Session session = sessionOpt.get();
                    log.debug("Session valid for user: {} role: {}", session.getUsername(), session.getRole());
                    List<GrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority(session.getRole()));
                    Authentication auth = new UsernamePasswordAuthenticationToken(
                            session.getUsername(), null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    log.debug("Session not found or expired: {}...", sessionId.substring(0, Math.min(20, sessionId.length())));
                }
            } catch (Exception e) {
                log.warn("Session validation failed: {}", e.getMessage());
            }
        } else {
            log.debug("No session ID in Authorization header");
        }
        filterChain.doFilter(request, response);
    }

    private String resolveSessionId(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
