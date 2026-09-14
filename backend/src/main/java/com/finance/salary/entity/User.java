package com.finance.salary.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(exclude = {"employee"})
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username cannot be blank")
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank(message = "Password hash cannot be blank")
    @Column(nullable = false)
    private String passwordHash;

    @NotBlank(message = "Role cannot be blank")
    @Column(nullable = false)
    private String role; // e.g., "ROLE_ADMIN", "ROLE_HR"

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = true)
    private Employee employee;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(
            mappedBy = "processedBy",
            cascade = CascadeType.DETACH,
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    private Set<SalaryRecord> processedRecords = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
