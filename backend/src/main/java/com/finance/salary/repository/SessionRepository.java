package com.finance.salary.repository;

import com.finance.salary.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    Optional<Session> findBySessionIdAndExpiresAtAfter(String sessionId, LocalDateTime now);

    List<Session> findByExpiresAtBefore(LocalDateTime now);

    void deleteByUsername(String username);
}
