package com.finance.salary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PayPeriodDTO {
    private Long id;
    
    @NotNull(message = "Start date cannot be null")
    private LocalDate startDate;
    
    @NotNull(message = "End date cannot be null")
    private LocalDate endDate;
    
    @NotNull(message = "Status cannot be null")
    private String status;
}
