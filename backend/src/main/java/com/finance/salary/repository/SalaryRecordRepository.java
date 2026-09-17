package com.finance.salary.repository;

import com.finance.salary.entity.SalaryRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRecordRepository extends JpaRepository<SalaryRecord, Long> {
    
    Optional<SalaryRecord> findByEmployeeIdAndPayPeriodId(Long employeeId, Long payPeriodId);
    
    List<SalaryRecord> findByEmployeeId(Long employeeId);
    
    List<SalaryRecord> findByPayPeriodId(Long payPeriodId);

    @Query("SELECT r FROM SalaryRecord r WHERE :search IS NULL OR :search = '' " +
            "OR LOWER(r.status) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.currencyCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.employee.employeeNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.employee.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.employee.lastName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<SalaryRecord> search(@Param("search") String search, Pageable pageable);
}
