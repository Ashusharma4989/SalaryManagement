package com.finance.salary.repository;

import com.finance.salary.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    // Add custom query methods as needed
}
