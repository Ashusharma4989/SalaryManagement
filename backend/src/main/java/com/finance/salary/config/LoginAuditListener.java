package com.finance.salary.config;

import com.finance.salary.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class LoginAuditListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private final AuditService auditService;

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        String username = event.getAuthentication().getName();
        log.info("Login event recorded for user: {}", username);
        auditService.logLogin(username);
    }
}
