package com.finance.salary.service;

import com.finance.salary.dto.EmployeeDTO;
import com.finance.salary.entity.Department;
import com.finance.salary.entity.Employee;
import com.finance.salary.exception.DuplicateResourceException;
import com.finance.salary.exception.ResourceNotFoundException;
import com.finance.salary.mapper.EntityMapper;
import com.finance.salary.repository.DepartmentRepository;
import com.finance.salary.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository repository;
    private final DepartmentRepository departmentRepository;
    private final EntityMapper mapper;

    public Page<EmployeeDTO> findAll(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return repository.findAll(pageable).map(mapper::toEmployeeDTO);
        }
        return repository.search(search, pageable).map(mapper::toEmployeeDTO);
    }

    public List<EmployeeDTO> findByDepartment(Long departmentId) {
        return repository.findAll().stream()
                .filter(e -> e.getDepartment() != null && e.getDepartment().getId().equals(departmentId))
                .map(mapper::toEmployeeDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO findById(Long id) {
        var employee = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        return mapper.toEmployeeDTO(employee);
    }

    @Transactional
    public EmployeeDTO create(EmployeeDTO dto) {
        repository.findByEmployeeNumber(dto.getEmployeeNumber())
                .ifPresent(e -> { throw new DuplicateResourceException("Employee", "employeeNumber", dto.getEmployeeNumber()); });
        if (dto.getEmail() != null) {
            repository.findByEmail(dto.getEmail())
                    .ifPresent(e -> { throw new DuplicateResourceException("Employee", "email", dto.getEmail()); });
        }
        Department dept = null;
        if (dto.getDepartmentId() != null) {
            dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", dto.getDepartmentId()));
        }
        Employee employee = mapper.toEmployeeEntity(dto);
        employee.setDepartment(dept);
        return mapper.toEmployeeDTO(repository.save(employee));
    }

    @Transactional
    public EmployeeDTO update(Long id, EmployeeDTO dto) {
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        if (!employee.getEmployeeNumber().equals(dto.getEmployeeNumber())) {
            repository.findByEmployeeNumber(dto.getEmployeeNumber())
                    .ifPresent(e -> { throw new DuplicateResourceException("Employee", "employeeNumber", dto.getEmployeeNumber()); });
        }
        if (dto.getEmail() != null && !dto.getEmail().equals(employee.getEmail())) {
            repository.findByEmail(dto.getEmail())
                    .ifPresent(e -> { throw new DuplicateResourceException("Employee", "email", dto.getEmail()); });
        }
        employee.setEmployeeNumber(dto.getEmployeeNumber());
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        employee.setLocation(dto.getLocation());
        employee.setCurrencyCode(dto.getCurrencyCode());
        employee.setHireDate(dto.getHireDate());
        if (dto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", dto.getDepartmentId()));
            employee.setDepartment(dept);
        } else {
            employee.setDepartment(null);
        }
        return mapper.toEmployeeDTO(repository.save(employee));
    }

    @Transactional
    public void delete(Long id) {
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        repository.delete(employee);
    }
}
