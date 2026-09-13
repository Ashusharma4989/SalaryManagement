package com.finance.salary.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Department name cannot be blank")
    @Column(nullable = false)
    private String name;

    @OneToMany(
            mappedBy = "department",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    private Set<Employee> employees = new HashSet<>();
}
