SET search_path = public;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  location TEXT,
  currency_code CHAR(3),
  hire_date DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);

-- Users (app users for auth/audit)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_employee ON users(employee_id);

-- Pay periods
CREATE TABLE IF NOT EXISTS pay_periods (
  id BIGSERIAL PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'OPEN',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payperiods_start_end ON pay_periods(start_date, end_date);

-- Salary records: one row per employee per pay period
CREATE TABLE IF NOT EXISTS salary_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  pay_period_id BIGINT NOT NULL REFERENCES pay_periods(id) ON DELETE RESTRICT,
  base_salary NUMERIC(14,2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  gross NUMERIC(14,2),
  total_deductions NUMERIC(14,2),
  net NUMERIC(14,2),
  status TEXT DEFAULT 'DRAFT',
  processed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, pay_period_id)
);

CREATE INDEX IF NOT EXISTS idx_salaryrecords_payperiod ON salary_records(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_salaryrecords_employee ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaryrecords_posted ON salary_records(pay_period_id) WHERE status = 'POSTED';

-- Salary items (component lines)
CREATE TABLE IF NOT EXISTS salary_items (
  id BIGSERIAL PRIMARY KEY,
  salary_record_id BIGINT NOT NULL REFERENCES salary_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salaryitems_record ON salary_items(salary_record_id);

-- Grants: ensure {DB_USERNAME} can use the schema and tables
GRANT USAGE ON SCHEMA public TO {DB_USERNAME};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {DB_USERNAME};
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO {DB_USERNAME};

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {DB_USERNAME};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO {DB_USERNAME};