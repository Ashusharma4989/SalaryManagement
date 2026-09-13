package com.finance.salary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmployeeDTO {
    private Long id;
    
    @NotBlank(message = "Employee number cannot be blank")
    private String employeeNumber;
    
    @NotBlank(message = "First name cannot be blank")
    private String firstName;
    
    @NotBlank(message = "Last name cannot be blank")
    private String lastName;
    
    @Email(message = "Email should be valid")
    private String email;
    
    private Long departmentId;
    private String departmentName;
    
    private String location;
    
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    private String currencyCode;
    
    private LocalDate hireDate;
}
