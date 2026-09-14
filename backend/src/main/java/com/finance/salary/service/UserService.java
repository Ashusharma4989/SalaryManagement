package com.finance.salary.service;

import com.finance.salary.dto.RegisterRequest;
import com.finance.salary.dto.UserDTO;
import com.finance.salary.entity.Employee;
import com.finance.salary.entity.User;
import com.finance.salary.exception.ResourceNotFoundException;
import com.finance.salary.mapper.EntityMapper;
import com.finance.salary.repository.EmployeeRepository;
import com.finance.salary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repository;
    private final EmployeeRepository employeeRepository;
    private final EntityMapper mapper;
    private final PasswordEncoder passwordEncoder;

    public Page<UserDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toUserDTO);
    }

    public UserDTO findById(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return mapper.toUserDTO(user);
    }

    @Transactional
    public UserDTO createUser(RegisterRequest request) {
        Employee employee = null;
        if (request.getEmployeeId() != null) {
            employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null && !request.getRole().isBlank()
                ? request.getRole() : "ROLE_HR");
        user.setEmployee(employee);
        return mapper.toUserDTO(repository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        repository.delete(user);
    }
}
