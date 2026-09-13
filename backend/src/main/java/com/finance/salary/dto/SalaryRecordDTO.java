package com.finance.salary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SalaryRecordDTO {
    private Long id;
    
    @NotNull(message = "Employee ID cannot be null")
    private Long employeeId;
    
    @NotNull(message = "Pay period ID cannot be null")
    private Long payPeriodId;
    
    @NotNull(message = "Base salary cannot be null")
    @DecimalMin(value = "0.01", message = "Base salary must be greater than 0")
    private BigDecimal baseSalary;
    
    @NotBlank(message = "Currency code cannot be blank")
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    private String currencyCode;
    
    @DecimalMin(value = "0.00", message = "Gross salary cannot be negative")
    private BigDecimal gross;
    
    @DecimalMin(value = "0.00", message = "Total deductions cannot be negative")
    private BigDecimal totalDeductions;
    
    @DecimalMin(value = "0.00", message = "Net salary cannot be negative")
    private BigDecimal net;
    
    @NotNull(message = "Status cannot be null")
    private String status;
    
    private Long processedById;
    private Set<SalaryItemDTO> salaryItems;
}
