package com.finance.salary.repository;

import com.finance.salary.entity.SalaryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRecordRepository extends JpaRepository<SalaryRecord, Long> {
    
    Optional<SalaryRecord> findByEmployeeIdAndPayPeriodId(Long employeeId, Long payPeriodId);
    
    List<SalaryRecord> findByEmployeeId(Long employeeId);
    
    List<SalaryRecord> findByPayPeriodId(Long payPeriodId);
}
