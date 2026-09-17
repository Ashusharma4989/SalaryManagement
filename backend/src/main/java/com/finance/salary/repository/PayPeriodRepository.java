package com.finance.salary.repository;

import com.finance.salary.entity.PayPeriod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PayPeriodRepository extends JpaRepository<PayPeriod, Long> {
    
    Optional<PayPeriod> findByStartDateAndEndDate(LocalDate startDate, LocalDate endDate);

    @Query("SELECT p FROM PayPeriod p WHERE :search IS NULL OR :search = '' OR LOWER(p.status) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<PayPeriod> search(@Param("search") String search, Pageable pageable);
}
