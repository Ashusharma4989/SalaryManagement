package com.finance.salary.repository;

import com.finance.salary.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    Optional<Employee> findByEmail(String email);

    @Query("SELECT e FROM Employee e WHERE :search IS NULL OR :search = '' " +
            "OR LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.location) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Employee> search(@Param("search") String search, Pageable pageable);
}
