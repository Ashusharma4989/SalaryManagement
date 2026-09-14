package com.finance.salary.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@Table(name = "employees")
@Data
@EqualsAndHashCode(exclude = {"department", "users", "salaryRecords"})
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Employee number cannot be blank")
    @Column(unique = true, nullable = false)
    private String employeeNumber;

    @NotBlank(message = "First name cannot be blank")
    @Column(nullable = false)
    private String firstName;

    @NotBlank(message = "Last name cannot be blank")
    @Column(nullable = false)
    private String lastName;

    @Email(message = "Email should be valid")
    @Column(unique = true)
    private String email;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = true)
    private Department department;

    @Column(nullable = true)
    private String location;

    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    @Column(length = 3)
    private String currencyCode;

    @Column(nullable = true)
    private LocalDate hireDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "employee",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    private Set<User> users = new HashSet<>();

    @OneToMany(
            mappedBy = "employee",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    private Set<SalaryRecord> salaryRecords = new HashSet<>();

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
