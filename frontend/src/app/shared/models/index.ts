export interface DepartmentDTO {
  id?: number;
  name: string;
}

export interface EmployeeDTO {
  id?: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  departmentId?: number;
  departmentName?: string;
  location?: string;
  currencyCode?: string;
  hireDate?: string;
}

export interface PayPeriodDTO {
  id?: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface SalaryItemDTO {
  id?: number;
  salaryRecordId?: number;
  name: string;
  type: string;
  amount: number;
}

export interface SalaryRecordDTO {
  id?: number;
  employeeId: number;
  payPeriodId: number;
  baseSalary: number;
  currencyCode: string;
  gross?: number;
  totalDeductions?: number;
  net?: number;
  status?: string;
  processedById?: number;
  salaryItems?: SalaryItemDTO[];
}

export interface UserDTO {
  id?: number;
  username: string;
  role: string;
  employeeId?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}
