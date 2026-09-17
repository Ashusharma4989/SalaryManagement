package com.finance.salary.controller;

import com.finance.salary.dto.JwtResponse;
import com.finance.salary.dto.LoginRequest;
import com.finance.salary.dto.RegisterRequest;
import com.finance.salary.dto.UserDTO;
import com.finance.salary.entity.Session;
import com.finance.salary.exception.UnauthorizedException;
import com.finance.salary.service.SessionService;
import com.finance.salary.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SessionService sessionService;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          SessionService sessionService,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.sessionService = sessionService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletRequest httpRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid username or password");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_USER");

        String ipAddress = getClientIp(httpRequest);
        Session session = sessionService.createSession(request.getUsername(), role, ipAddress);

        JwtResponse response = JwtResponse.builder()
                .token(session.getSessionId())
                .username(request.getUsername())
                .role(role)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        String bearer = httpRequest.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            String sessionId = bearer.substring(7);
            sessionService.deleteSession(sessionId);
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {
        UserDTO created = userService.createUser(request);
        return ResponseEntity.ok(created);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
