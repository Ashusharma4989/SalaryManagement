package com.finance.salary.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "pay_periods")
@Data
@EqualsAndHashCode(exclude = {"salaryRecords"})
@NoArgsConstructor
@AllArgsConstructor
public class PayPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Start date cannot be null")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date cannot be null")
    @Column(nullable = false)
    private LocalDate endDate;

    @NotNull(message = "Status cannot be null")
    @Column(nullable = false)
    private String status; // e.g., "OPEN", "CLOSED", "POSTED"

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(
            mappedBy = "payPeriod",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    private Set<SalaryRecord> salaryRecords = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
