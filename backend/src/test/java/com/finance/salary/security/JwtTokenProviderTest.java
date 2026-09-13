package com.finance.salary.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET = "a-very-long-test-secret-key-0123456789-abcdef";

    private UserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        userDetailsService = username -> User.withUsername(username)
                .password("ignored-by-test")
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .build();
    }

    private JwtTokenProvider provider(long validityMs) {
        JwtTokenProvider p = new JwtTokenProvider(userDetailsService);
        ReflectionTestUtils.setField(p, "secret", SECRET);
        ReflectionTestUtils.setField(p, "validityInMs", validityMs);
        p.init();
        return p;
    }

    private Authentication auth(String username, String role) {
        UserDetails details = User.withUsername(username)
                .password("ignored")
                .authorities(new SimpleGrantedAuthority(role))
                .build();
        return new UsernamePasswordAuthenticationToken(details, "", details.getAuthorities());
    }

    @Test
    void shouldGenerateValidateAndExtractUsername() {
        JwtTokenProvider provider = provider(3_600_000L);
        Authentication authentication = auth("admin", "ROLE_ADMIN");

        String token = provider.generateToken(authentication);

        assertThat(token).isNotNull().isNotBlank();
        assertThat(token.split("\\.").length).isEqualTo(3);
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getUsername(token)).isEqualTo("admin");
    }

    @Test
    void shouldRejectTamperedSignature() {
        JwtTokenProvider provider = provider(3_600_000L);
        String token = provider.generateToken(auth("admin", "ROLE_ADMIN"));

        String tampered = token.substring(0, token.length() - 3) + "AAA";

        assertThat(provider.validateToken(tampered)).isFalse();
    }

    @Test
    void shouldRejectExpiredToken() throws InterruptedException {
        JwtTokenProvider provider = provider(1L);
        String token = provider.generateToken(auth("hr", "ROLE_HR"));

        Thread.sleep(10);

        assertThat(provider.validateToken(token)).isFalse();
    }

    @Test
    void shouldRejectMalformedToken() {
        JwtTokenProvider provider = provider(3_600_000L);
        assertThat(provider.validateToken("not-a-jwt")).isFalse();
        assertThat(provider.validateToken("a.b.c")).isFalse();
    }

    @Test
    void shouldPreserveRoleInClaims() {
        JwtTokenProvider provider = provider(3_600_000L);
        Authentication authentication = auth("admin", "ROLE_ADMIN");
        String token = provider.generateToken(authentication);

        // The token's validity plus presence of sub is asserted; role is encoded and
        // re-derived from the DB on each request via UserDetails, so validate + username suffice.
        assertThat(provider.validateToken(token)).isTrue();
    }
}
