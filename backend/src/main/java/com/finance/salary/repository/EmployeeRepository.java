package com.finance.salary.repository;

import com.finance.salary.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    
    Optional<Employee> findByEmployeeNumber(String employeeNumber);
    
    Optional<Employee> findByEmail(String email);
}
