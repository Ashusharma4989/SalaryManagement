package com.finance.salary.repository;

import com.finance.salary.entity.SalaryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryItemRepository extends JpaRepository<SalaryItem, Long> {
    
    List<SalaryItem> findBySalaryRecordId(Long salaryRecordId);
}
