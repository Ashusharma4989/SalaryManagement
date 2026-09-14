package com.finance.salary.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "salary_records")
@Data
@EqualsAndHashCode(exclude = {"salaryItems", "employee", "payPeriod", "processedBy"})
@NoArgsConstructor
@AllArgsConstructor
public class SalaryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pay_period_id", nullable = false)
    private PayPeriod payPeriod;

    @NotNull(message = "Base salary cannot be null")
    @DecimalMin(value = "0.01", message = "Base salary must be greater than 0")
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal baseSalary;

    @NotBlank(message = "Currency code cannot be blank")
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    @Column(length = 3, nullable = false)
    private String currencyCode;

    @DecimalMin(value = "0.00", message = "Gross salary cannot be negative")
    @Column(precision = 14, scale = 2)
    private BigDecimal gross;

    @DecimalMin(value = "0.00", message = "Total deductions cannot be negative")
    @Column(precision = 14, scale = 2)
    private BigDecimal totalDeductions;

    @DecimalMin(value = "0.00", message = "Net salary cannot be negative")
    @Column(precision = 14, scale = 2)
    private BigDecimal net;

    @NotNull(message = "Status cannot be null")
    @Column(nullable = false)
    private String status; // e.g., "DRAFT", "POSTED", "PROCESSED"

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by", nullable = true)
    private User processedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "salaryRecord",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    private Set<SalaryItem> salaryItems = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
