# Salary Management System

A full-stack enterprise-grade salary management application built with Spring Boot and Angular, featuring audit trails, AI-powered chat assistance, role-based access control, and a modern responsive UI.

---

## Overview

The Salary Management System automates end-to-end payroll operations — from employee onboarding and pay period management to salary calculation, processing workflows, and comprehensive audit logging. An integrated AI chatbot (powered by Ollama) provides intelligent assistance for salary-related queries.

---

## Features


| **Module** | **Description** |
|---|---|
| Authentication & Security | JWT-based auth, role-based access control, secure API endpoints |
| Department Management | Create, read, update, delete departments |
| Employee Management | Manage employee profiles, departments, locations, and currencies |
| Pay Period Management | Define pay periods with status tracking (OPEN, CLOSED) |
| Salary Records | Create salary records with line items, process through workflow |
| Salary Processing | Multi-stage workflow: DRAFT → PROCESSED → POSTED |
| Audit Trail | Full audit logging of all CRUD operations and login events |
| AI Chatbot | Local Llama 3.2 chatbot for salary management assistance |
| Search & Sort | Real-time search and column sorting across all modules |
| Responsive UI | Modern, responsive design with dark mode support |


---

### Core Modules

#### 1. Authentication & Security
- **JWT-based authentication** with secure token storage
- **Role-based access control** (admin, hr, manager)
- **Login audit logging** — every successful login is recorded in the audit trail
- **Default credentials**: `admin` / `admin`

#### 2. Department Management
- Create, view, update, and delete departments
- Search by name with auto-complete suggestions
- Sort by any column (name, creation date, etc.)
- Pagination with configurable page sizes

#### 3. Employee Management
- Full employee profiles (name, email, employee number, department, location, hire date, currency)
- Department assignment via dropdown select
- Search across multiple fields (employee number, first name, last name, email)
- Column sorting and server-side pagination

#### 4. Pay Period Management
- Define pay periods with start/end dates and status (OPEN, CLOSED)
- Workflow status tracking — only open periods can be assigned to salary records
- Search by status and date range
- Full audit trail on all changes

#### 5. Salary Records
A complete salary processing workflow with three distinct statuses:

| Status | Description | Available Actions |
|--------|-------------|-------------------|
| `DRAFT` | Initial record with base salary and line items | Edit, Process, Delete |
| `PROCESSED` | Calculated gross, deductions, and net pay | Post, Edit line items |
| `POSTED` | Final posted state | Read-only |

- **Dynamic salary line items** — add/remove earnings and deductions with live totals
- **Auto-calculation** — gross pay, total deductions, and net pay computed automatically
- **Multi-step workflow**: Create (DRAFT) → Process (PROCESSED) → Post (POSTED)
- **Employee & Pay Period assignment** with validation

#### 6. Audit Trail
Every create, update, and delete operation is logged with:
- **Action type** (CREATE, UPDATE, DELETE, LOGIN)
- **Entity type** and entity ID
- **Old values** and new values (for UPDATE operations)
- **Timestamp** and **performed by** (username)
- **API endpoint** for quick reference
- Searchable audit log dashboard with pagination

#### 7. AI Chatbot (Ollama)
- Integrated AI assistant powered by **Llama 3.2** (local inference)
- Conversational interface for salary-related questions
- Chat history with timestamps (auto-scrolling)
- Runs entirely locally — no external API keys required
- Optional: works without Ollama (chatbot shows graceful error)

#### 8. Search, Sort & Pagination
- **Global search** with real-time filtering on every module
- **Column sorting** — click any column header to sort ascending/descending
- **Server-side pagination** with configurable page sizes (25, 50, 100)
- **Row action buttons** — context-sensitive actions per row (edit, process, post, delete)

#### 9. Modern UI
- **Accordion-style forms** — forms auto-expand on edit, with cancel button
- **Card-based dashboard** — summary cards with key metrics
- **Responsive design** — works on desktop and mobile
- **Form validation** — real-time validation with error messages
- **Snackbar notifications** — success/error feedback on all operations

---

### Technical Features

| **Category** | **Details** |
|---|---|
| **Backend Framework** | Spring Boot 4.x, Java 17 |
| **Frontend Framework** | Angular 17+, TypeScript |
| **Database** | PostgreSQL 15+ |
| **ORM** | Spring Data JPA (Hibernate 6.x) |
| **Schema Migrations** | Flyway |
| **Security** | Spring Security 6.x, JWT |
| **API Style** | RESTful with pagination |
| **Audit Logging** | Spring AOP Aspect + Authentication Event Listeners |
| **AI/LLM** | Ollama (Llama 3.2:3b) |
| **Build Tools** | Maven (backend), npm/Angular CLI (frontend) |

---

## Quick Start

See **[setup.md](setup.md)** for the complete step-by-step setup guide.

```bash
# 1. Start PostgreSQL
#    Ensure database 'salary_management' exists

# 2. Start backend (port 8080)
cd backend && ./mvnw spring-boot:run

# 3. Start frontend (port 4200)
cd frontend && ng serve

# 4. Open in browser: http://localhost:4200
#    Login with admin / admin
```

---

## API Endpoints

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Auth | POST | `/api/v1/auth/login` | Authenticate and receive JWT |
| Departments | GET | `/api/v1/departments` | List with search, sort, pagination |
| Departments | POST | `/api/v1/departments` | Create new department |
| Departments | PUT | `/api/v1/departments/{id}` | Update department |
| Departments | DELETE | `/api/v1/departments/{id}` | Delete department |
| Employees | GET | `/api/v1/employees` | List with search, sort, pagination |
| Employees | POST | `/api/v1/employees` | Create new employee |
| Employees | PUT | `/api/v1/employees/{id}` | Update employee |
| Employees | DELETE | `/api/v1/employees/{id}` | Delete employee |
| Pay Periods | GET | `/api/v1/pay-periods` | List with search, sort, pagination |
| Pay Periods | POST | `/api/v1/pay-periods` | Create new pay period |
| Pay Periods | PUT | `/api/v1/pay-periods/{id}` | Update pay period |
| Pay Periods | DELETE | `/api/v1/pay-periods/{id}` | Delete pay period |
| Salary Records | GET | `/api/v1/salary-records` | List with search, sort, pagination |
| Salary Records | POST | `/api/v1/salary-records` | Create salary record |
| Salary Records | PUT | `/api/v1/salary-records/{id}` | Update salary record |
| Salary Records | PATCH | `/api/v1/salary-records/{id}/process` | Process (DRAFT → PROCESSED) |
| Salary Records | PATCH | `/api/v1/salary-records/{id}/post` | Post (PROCESSED → POSTED) |
| Salary Records | DELETE | `/api/v1/salary-records/{id}` | Delete salary record |
| Audit | GET | `/api/v1/audit` | Search audit logs |
| Users | GET | `/api/v1/users` | List application users |
| Users | GET | `/api/v1/users/me` | Get current authenticated user |

All endpoints support:
- `?page={n}&size={n}` — pagination
- `?search={term}` — full-text search
- `&sort={field},{direction}` — sorting (asc/desc)

---

## Screenshots

### Login Page
Secure JWT-based authentication with audit logging.

### Dashboard
Overview with summary cards and quick access to all modules.

### Salary Records Table
Full data table with search, sort, pagination, and context-sensitive action buttons.

### Salary Record Form
Accordion-style form with dynamic salary line items, auto-calculated totals, and form validation.

### Audit Trail
Searchable audit log showing all create, update, and delete operations with old/new values.

### AI Chatbot
Local Llama 3.2-powered chatbot for salary management assistance with chat history.

---

## Architecture

```
SalaryManagement/
├── backend/                              # Spring Boot 4.x application
│   ├── src/main/java/com/...
│   │   ├── entity/                       # JPA Entities (10+ entities)
│   │   ├── repository/                   # Spring Data JPA Repositories
│   │   ├── controller/                   # REST Controllers (8 controllers)
│   │   ├── service/                      # Business Logic Services
│   │   ├── security/                     # JWT Auth, SecurityConfig, AuthController
│   │   ├── audit/                        # AuditAspect, LoginAuditListener, AuditController
│   │   ├── config/                       # DataInitializer, ModelMapperConfig
│   │   └── SalaryManagementApplication.java
│   ├── src/main/resources/
│   │   ├── db/migration/                 # Flyway migrations (V1 - V5+)
│   │   ├── application.yml               # Spring configuration
│   │   └── data.sql                      # Seed data
│   └── pom.xml
├── frontend/                             # Angular 17+ application
│   ├── src/app/
│   │   ├── modules/                      # Feature modules
│   │   │   ├── departments/              # Department CRUD module
│   │   │   ├── employees/                # Employee CRUD module
│   │   │   ├── pay-periods/              # Pay Period module
│   │   │   ├── salary-records/           # Salary Record module (core workflow)
│   │   │   └── users/                    # User management module
│   │   ├── shared/                       # Shared components
│   │   │   ├── services/                 # ApiService, AuthService, SnackbarService
│   │   │   ├── components/               # Reusable UI components
│   │   │   │   ├── page-template/        # Master page template (accordion, table, form)
│   │   │   │   ├── card/                 # Dashboard cards
│   │   │   │   ├── table/                # Data table with search/sort/pagination
│   │   │   │   ├── form/                 # Form fields, salary items field
│   │   │   │   └── chatbot/              # AI chatbot component (Ollama)
│   │   │   └── models/                   # DTOs and interfaces
│   │   ├── auth/                         # Login/register, JWT interceptor
│   │   └── shell/                        # Layout (header, sidebar)
│   ├── angular.json
│   └── package.json
├── setup.md                              # Complete setup guide
├── README.md                             # This file
└── AGENTS.md                             # Build and test commands
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 17+, TypeScript, Angular Reactive Forms |
| **Backend** | Spring Boot 4.x, Java 17, Maven |
| **Database** | PostgreSQL 15 |
| **ORM** | Spring Data JPA, Hibernate 6.x |
| **Security** | Spring Security 6.x, JWT |
| **API Documentation** | RESTful JSON |
| **AI/Chatbot** | Ollama, Llama 3.2:3b |
| **Testing** | JUnit 5, Angular TestBed |
| **Dev Tools** | Spring Boot DevTools, Angular CLI, Flyway |

---

## License

[MIT License](LICENSE)

---

## Acknowledgments

- Built with Spring Boot and Angular
- AI chatbot powered by [Ollama](https://ollama.com) and Llama 3.2
- Icons by [Heroicons](https://heroicons.com)
