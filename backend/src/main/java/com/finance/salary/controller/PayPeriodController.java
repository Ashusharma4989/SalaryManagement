package com.finance.salary.controller;

import com.finance.salary.dto.PayPeriodDTO;
import com.finance.salary.service.PayPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/pay-periods")
@RequiredArgsConstructor
public class PayPeriodController {

    private final PayPeriodService service;

    @GetMapping
    public ResponseEntity<Page<PayPeriodDTO>> findAll(
            @RequestParam(defaultValue = "") String search,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(service.findAll(search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayPeriodDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<PayPeriodDTO> create(@Valid @RequestBody PayPeriodDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PayPeriodDTO> update(@PathVariable Long id, @Valid @RequestBody PayPeriodDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<PayPeriodDTO> close(@PathVariable Long id) {
        return ResponseEntity.ok(service.close(id));
    }

    @PatchMapping("/{id}/open")
    public ResponseEntity<PayPeriodDTO> open(@PathVariable Long id) {
        return ResponseEntity.ok(service.open(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
