package com.finance.salary.repository;

import com.finance.salary.entity.PayPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PayPeriodRepository extends JpaRepository<PayPeriod, Long> {
    
    Optional<PayPeriod> findByStartDateAndEndDate(LocalDate startDate, LocalDate endDate);
}
