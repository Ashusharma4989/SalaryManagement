package com.finance.salary.service;

import com.finance.salary.dto.PayPeriodDTO;
import com.finance.salary.entity.PayPeriod;
import com.finance.salary.exception.DuplicateResourceException;
import com.finance.salary.exception.ResourceNotFoundException;
import com.finance.salary.exception.ValidationException;
import com.finance.salary.mapper.EntityMapper;
import com.finance.salary.repository.PayPeriodRepository;
import com.finance.salary.repository.SalaryRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayPeriodService {

    private final PayPeriodRepository repository;
    private final SalaryRecordRepository salaryRecordRepository;
    private final EntityMapper mapper;

    public Page<PayPeriodDTO> findAll(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return repository.findAll(pageable).map(mapper::toPayPeriodDTO);
        }
        return repository.search(search, pageable).map(mapper::toPayPeriodDTO);
    }

    public PayPeriodDTO findById(Long id) {
        var period = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", id));
        return mapper.toPayPeriodDTO(period);
    }

    @Transactional
    public PayPeriodDTO create(PayPeriodDTO dto) {
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new ValidationException("Pay period end date must not be before start date");
        }
        repository.findByStartDateAndEndDate(dto.getStartDate(), dto.getEndDate())
                .ifPresent(p -> { throw new DuplicateResourceException("PayPeriod", "startDate+endDate", dto.getStartDate() + "/" + dto.getEndDate()); });
        if (dto.getStatus() == null) {
            dto.setStatus("OPEN");
        }
        var period = mapper.toPayPeriodEntity(dto);
        return mapper.toPayPeriodDTO(repository.save(period));
    }

    @Transactional
    public PayPeriodDTO update(Long id, PayPeriodDTO dto) {
        var period = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", id));
        if (!period.getStartDate().equals(dto.getStartDate()) || !period.getEndDate().equals(dto.getEndDate())) {
            repository.findByStartDateAndEndDate(dto.getStartDate(), dto.getEndDate())
                    .ifPresent(p -> { throw new DuplicateResourceException("PayPeriod", "startDate+endDate", dto.getStartDate() + "/" + dto.getEndDate()); });
            period.setStartDate(dto.getStartDate());
            period.setEndDate(dto.getEndDate());
        }
        if (dto.getStatus() != null) {
            period.setStatus(dto.getStatus());
        }
        return mapper.toPayPeriodDTO(repository.save(period));
    }

    @Transactional
    public PayPeriodDTO close(Long id) {
        var period = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", id));
        if ("CLOSED".equalsIgnoreCase(period.getStatus()) || "POSTED".equalsIgnoreCase(period.getStatus())) {
            throw new ValidationException("Pay period is already " + period.getStatus());
        }
        boolean hasPosted = salaryRecordRepository.findByPayPeriodId(id).stream()
                .anyMatch(r -> "POSTED".equalsIgnoreCase(r.getStatus()));
        if (hasPosted) {
            throw new ValidationException("Cannot close a pay period that has posted salary records");
        }
        period.setStatus("CLOSED");
        return mapper.toPayPeriodDTO(repository.save(period));
    }

    @Transactional
    public PayPeriodDTO open(Long id) {
        var period = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", id));
        period.setStatus("OPEN");
        return mapper.toPayPeriodDTO(repository.save(period));
    }

    @Transactional
    public void delete(Long id) {
        var period = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", id));
        repository.delete(period);
    }
}
