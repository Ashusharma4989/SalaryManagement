package com.finance.salary.repository;

import com.finance.salary.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByName(String name);

    Page<Department> findByNameContainingIgnoreCase(String search, Pageable pageable);
}
