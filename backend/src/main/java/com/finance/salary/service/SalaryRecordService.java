package com.finance.salary.service;

import com.finance.salary.dto.SalaryItemDTO;
import com.finance.salary.dto.SalaryRecordDTO;
import com.finance.salary.entity.Employee;
import com.finance.salary.entity.PayPeriod;
import com.finance.salary.entity.SalaryItem;
import com.finance.salary.entity.SalaryRecord;
import com.finance.salary.entity.User;
import com.finance.salary.exception.DuplicateResourceException;
import com.finance.salary.exception.ResourceNotFoundException;
import com.finance.salary.exception.ValidationException;
import com.finance.salary.mapper.EntityMapper;
import com.finance.salary.repository.EmployeeRepository;
import com.finance.salary.repository.PayPeriodRepository;
import com.finance.salary.repository.SalaryRecordRepository;
import com.finance.salary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalaryRecordService {

    private final SalaryRecordRepository repository;
    private final EmployeeRepository employeeRepository;
    private final PayPeriodRepository payPeriodRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;

    public Page<SalaryRecordDTO> findAll(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return repository.findAll(pageable).map(mapper::toSalaryRecordDTO);
        }
        return repository.search(search, pageable).map(mapper::toSalaryRecordDTO);
    }

    public SalaryRecordDTO findById(Long id) {
        var record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", id));
        return mapper.toSalaryRecordDTO(record);
    }

    public List<SalaryRecordDTO> findByEmployee(Long employeeId) {
        return repository.findByEmployeeId(employeeId).stream()
                .map(mapper::toSalaryRecordDTO)
                .collect(Collectors.toList());
    }

    public List<SalaryRecordDTO> findByPayPeriod(Long payPeriodId) {
        return repository.findByPayPeriodId(payPeriodId).stream()
                .map(mapper::toSalaryRecordDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SalaryRecordDTO create(SalaryRecordDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", dto.getEmployeeId()));
        PayPeriod payPeriod = payPeriodRepository.findById(dto.getPayPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", dto.getPayPeriodId()));

        if (!"OPEN".equalsIgnoreCase(payPeriod.getStatus())) {
            throw new ValidationException("Cannot create a salary record for a non-open pay period");
        }
        repository.findByEmployeeIdAndPayPeriodId(employee.getId(), payPeriod.getId())
                .ifPresent(r -> { throw new DuplicateResourceException("SalaryRecord", "employee+payPeriod", employee.getId() + "/" + payPeriod.getId()); });

        SalaryRecord record = mapper.toSalaryRecordEntity(dto);
        record.getSalaryItems().clear();
        record.setEmployee(employee);
        record.setPayPeriod(payPeriod);
        record.setStatus("DRAFT");
        if (dto.getProcessedById() != null) {
            User processedBy = userRepository.findById(dto.getProcessedById())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.getProcessedById()));
            record.setProcessedBy(processedBy);
        }
        addItems(record, dto.getSalaryItems());
        recomputeTotals(record);
        return mapper.toSalaryRecordDTO(repository.save(record));
    }

    @Transactional
    public SalaryRecordDTO update(Long id, SalaryRecordDTO dto) {
        SalaryRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", id));
        validateMutable(record);
        if (dto.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", dto.getEmployeeId()));
            record.setEmployee(employee);
            record.setPayPeriod(payPeriodRepository.findById(dto.getPayPeriodId())
                    .orElseThrow(() -> new ResourceNotFoundException("PayPeriod", dto.getPayPeriodId())));
        }
        if (dto.getProcessedById() != null) {
            User processedBy = userRepository.findById(dto.getProcessedById())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.getProcessedById()));
            record.setProcessedBy(processedBy);
        }
        record.setBaseSalary(dto.getBaseSalary());
        record.setCurrencyCode(dto.getCurrencyCode());
        if (dto.getStatus() != null) {
            record.setStatus(dto.getStatus());
        }
        record.getSalaryItems().clear();
        addItems(record, dto.getSalaryItems());
        recomputeTotals(record);
        return mapper.toSalaryRecordDTO(repository.save(record));
    }

    @Transactional
    public SalaryRecordDTO addItem(Long recordId, SalaryItemDTO itemDto) {
        SalaryRecord record = repository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", recordId));
        validateMutable(record);
        SalaryItem item = mapper.toSalaryItemEntity(itemDto);
        item.setSalaryRecord(record);
        record.getSalaryItems().add(item);
        recomputeTotals(record);
        return mapper.toSalaryRecordDTO(repository.save(record));
    }

    @Transactional
    public SalaryRecordDTO deleteItem(Long recordId, Long itemId) {
        SalaryRecord record = repository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", recordId));
        validateMutable(record);
        boolean removed = record.getSalaryItems().removeIf(item -> item.getId().equals(itemId));
        if (!removed) {
            throw new ResourceNotFoundException("SalaryItem", itemId);
        }
        recomputeTotals(record);
        return mapper.toSalaryRecordDTO(repository.save(record));
    }

    @Transactional
    public SalaryRecordDTO markProcessed(Long id, Long processedById) {
        SalaryRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", id));
        if ("POSTED".equalsIgnoreCase(record.getStatus())) {
            throw new ValidationException("Cannot modify a posted salary record");
        }
        User processedBy = userRepository.findById(processedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", processedById));
        record.setProcessedBy(processedBy);
        record.setStatus("PROCESSED");
        recomputeTotals(record);
        return mapper.toSalaryRecordDTO(repository.save(record));
    }

    @Transactional
    public SalaryRecordDTO markPosted(Long id) {
        SalaryRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", id));
        if (!"PROCESSED".equalsIgnoreCase(record.getStatus())) {
            throw new ValidationException("Salary record must be PROCESSED before it can be posted");
        }
        record.setStatus("POSTED");
        return mapper.toSalaryRecordDTO(repository.save(record));
    }

    @Transactional
    public void delete(Long id) {
        SalaryRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryRecord", id));
        repository.delete(record);
    }

    private void addItems(SalaryRecord record, Set<SalaryItemDTO> itemDtos) {
        if (itemDtos == null) return;
        for (SalaryItemDTO itemDto : itemDtos) {
            SalaryItem item = mapper.toSalaryItemEntity(itemDto);
            item.setSalaryRecord(record);
            record.getSalaryItems().add(item);
        }
    }

    private void recomputeTotals(SalaryRecord record) {
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;
        for (SalaryItem item : record.getSalaryItems()) {
            if ("EARNING".equalsIgnoreCase(item.getType())) {
                gross = gross.add(item.getAmount());
            } else if ("DEDUCTION".equalsIgnoreCase(item.getType())) {
                deductions = deductions.add(item.getAmount());
            }
        }
        record.setGross(gross);
        record.setTotalDeductions(deductions);
        record.setNet(gross.subtract(deductions));
    }

    private void validateMutable(SalaryRecord record) {
        if ("POSTED".equalsIgnoreCase(record.getStatus())) {
            throw new ValidationException("Cannot modify a posted salary record");
        }
    }
}
