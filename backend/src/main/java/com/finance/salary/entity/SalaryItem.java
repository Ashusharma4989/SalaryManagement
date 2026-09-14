package com.finance.salary.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_items")
@Data
@EqualsAndHashCode(exclude = {"salaryRecord"})
@NoArgsConstructor
@AllArgsConstructor
public class SalaryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_record_id", nullable = false)
    private SalaryRecord salaryRecord;

    @NotBlank(message = "Item name cannot be blank")
    @Column(nullable = false)
    private String name; // e.g., "Basic Salary", "HRA", "Tax Deduction"

    @NotBlank(message = "Item type cannot be blank")
    @Column(nullable = false)
    private String type; // e.g., "EARNING", "DEDUCTION"

    @NotNull(message = "Amount cannot be null")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
