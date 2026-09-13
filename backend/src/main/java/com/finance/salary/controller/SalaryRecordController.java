package com.finance.salary.controller;

import com.finance.salary.dto.SalaryItemDTO;
import com.finance.salary.dto.SalaryRecordDTO;
import com.finance.salary.service.SalaryRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/salary-records")
@RequiredArgsConstructor
public class SalaryRecordController {

    private final SalaryRecordService service;

    @GetMapping
    public ResponseEntity<Page<SalaryRecordDTO>> findAll(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SalaryRecordDTO>> findByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(service.findByEmployee(employeeId));
    }

    @GetMapping("/pay-period/{payPeriodId}")
    public ResponseEntity<List<SalaryRecordDTO>> findByPayPeriod(@PathVariable Long payPeriodId) {
        return ResponseEntity.ok(service.findByPayPeriod(payPeriodId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryRecordDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<SalaryRecordDTO> create(@Valid @RequestBody SalaryRecordDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryRecordDTO> update(@PathVariable Long id, @Valid @RequestBody SalaryRecordDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<SalaryRecordDTO> addItem(@PathVariable Long id, @Valid @RequestBody SalaryItemDTO itemDto) {
        return ResponseEntity.ok(service.addItem(id, itemDto));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<SalaryRecordDTO> deleteItem(@PathVariable Long id, @PathVariable Long itemId) {
        return ResponseEntity.ok(service.deleteItem(id, itemId));
    }

    @PatchMapping("/{id}/process")
    public ResponseEntity<SalaryRecordDTO> markProcessed(@PathVariable Long id,
                                                         @RequestParam Long processedById) {
        return ResponseEntity.ok(service.markProcessed(id, processedById));
    }

    @PatchMapping("/{id}/post")
    public ResponseEntity<SalaryRecordDTO> markPosted(@PathVariable Long id) {
        return ResponseEntity.ok(service.markPosted(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
