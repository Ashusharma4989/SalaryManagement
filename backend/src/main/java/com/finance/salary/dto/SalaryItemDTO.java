package com.finance.salary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SalaryItemDTO {
    private Long id;
    
    private Long salaryRecordId;
    
    @NotBlank(message = "Item name cannot be blank")
    private String name;
    
    @NotBlank(message = "Item type cannot be blank")
    private String type;
    
    @NotNull(message = "Amount cannot be null")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
}
