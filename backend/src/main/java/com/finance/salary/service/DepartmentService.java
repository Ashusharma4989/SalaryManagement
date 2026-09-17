package com.finance.salary.service;

import com.finance.salary.dto.DepartmentDTO;
import com.finance.salary.exception.DuplicateResourceException;
import com.finance.salary.exception.ResourceNotFoundException;
import com.finance.salary.mapper.EntityMapper;
import com.finance.salary.repository.DepartmentRepository;
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
public class DepartmentService {

    private final DepartmentRepository repository;
    private final EntityMapper mapper;

    public Page<DepartmentDTO> findAll(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return repository.findAll(pageable).map(mapper::toDepartmentDTO);
        }
        return repository.findByNameContainingIgnoreCase(search, pageable).map(mapper::toDepartmentDTO);
    }

    public DepartmentDTO findById(Long id) {
        var department = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        return mapper.toDepartmentDTO(department);
    }

    @Transactional
    public DepartmentDTO create(DepartmentDTO dto) {
        if (repository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("Department", "name", dto.getName());
        }
        var department = mapper.toDepartmentEntity(dto);
        return mapper.toDepartmentDTO(repository.save(department));
    }

    @Transactional
    public DepartmentDTO update(Long id, DepartmentDTO dto) {
        var department = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        if (!department.getName().equals(dto.getName()) && repository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("Department", "name", dto.getName());
        }
        department.setName(dto.getName());
        return mapper.toDepartmentDTO(repository.save(department));
    }

    @Transactional
    public void delete(Long id) {
        var department = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        repository.delete(department);
    }
}
