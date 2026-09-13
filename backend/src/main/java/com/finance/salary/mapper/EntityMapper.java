package com.finance.salary.mapper;

import com.finance.salary.dto.DepartmentDTO;
import com.finance.salary.dto.EmployeeDTO;
import com.finance.salary.dto.PayPeriodDTO;
import com.finance.salary.dto.SalaryItemDTO;
import com.finance.salary.dto.SalaryRecordDTO;
import com.finance.salary.dto.UserDTO;
import com.finance.salary.entity.Department;
import com.finance.salary.entity.Employee;
import com.finance.salary.entity.PayPeriod;
import com.finance.salary.entity.SalaryItem;
import com.finance.salary.entity.SalaryRecord;
import com.finance.salary.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EntityMapper {

    // Department mappings
    DepartmentDTO toDepartmentDTO(Department department);
    Department toDepartmentEntity(DepartmentDTO dto);

    // Employee mappings
    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.name")
    EmployeeDTO toEmployeeDTO(Employee employee);
    
    @Mapping(target = "department", ignore = true)
    Employee toEmployeeEntity(EmployeeDTO dto);

    // User mappings
    @Mapping(target = "password", ignore = true)
    UserDTO toUserDTO(User user);
    
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "employee", ignore = true)
    User toUserEntity(UserDTO dto);

    // PayPeriod mappings
    PayPeriodDTO toPayPeriodDTO(PayPeriod payPeriod);
    PayPeriod toPayPeriodEntity(PayPeriodDTO dto);

    // SalaryRecord mappings
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "payPeriodId", source = "payPeriod.id")
    @Mapping(target = "processedById", source = "processedBy.id")
    SalaryRecordDTO toSalaryRecordDTO(SalaryRecord salaryRecord);
    
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "payPeriod", ignore = true)
    @Mapping(target = "processedBy", ignore = true)
    SalaryRecord toSalaryRecordEntity(SalaryRecordDTO dto);

    // SalaryItem mappings
    @Mapping(target = "salaryRecordId", source = "salaryRecord.id")
    SalaryItemDTO toSalaryItemDTO(SalaryItem salaryItem);
    
    @Mapping(target = "salaryRecord", ignore = true)
    SalaryItem toSalaryItemEntity(SalaryItemDTO dto);
}
