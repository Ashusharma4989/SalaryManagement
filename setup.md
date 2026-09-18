# Local Development Setup Guide

This document explains how to set up and run the Salary Management project locally from scratch.

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

| Tool | Version |
|------|---------|
| **Java** | JDK 17 or higher |
| **Maven** | 3.9+ (or use the bundled `mvnw` wrapper) |
| **Node.js** | 20 or higher |
| **npm** | 10+ (shipped with Node.js) |
| **PostgreSQL** | 15 or higher |
| **Angular CLI** | 17+ (`npm install -g @angular/cli`) |

---

## Step 1: Clone the Repository

```bash
git clone <repository-url> SalaryManagement
cd SalaryManagement
```

---

## Step 2: Set Up PostgreSQL

### 2.1 Install PostgreSQL

If you don't have PostgreSQL installed:

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download the installer from [postgresql.org](https://www.postgresql.org/download/windows/) and run it.

### 2.2 Create the Database and User

1. Open `psql`:
```bash
psql postgres
```

2. Create the database and user (use `admin` / `admin` for the default dev credentials):
```sql
CREATE USER admin WITH PASSWORD 'admin';
CREATE DATABASE salary_management OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE salary_management TO admin;
\q
```

> **Note:** If PostgreSQL was installed via Homebrew, the default superuser is your macOS username. You may need to connect as that user first:
> ```bash
> psql -U <your-macos-username> postgres
> ```

---

## Step 3: Configure the Backend

### 3.1 Environment Variables

The backend reads configuration from environment variables. Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salary_management
DB_USERNAME=admin
DB_PASSWORD=admin
```

Alternatively, you can set these in your shell or through your IDE run configuration.

### 3.2 Application Properties

The backend uses `src/main/resources/application.yml` for configuration. The default profile is `dev`. Review the file to confirm database connection settings match your local PostgreSQL setup:

```yaml
# backend/src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/salary_management
    username: ${DB_USERNAME:admin}
    password: ${DB_PASSWORD:admin}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
  flyway:
    enabled: true
    baseline-on-migrate: true
```

> The `ddl-auto: validate` setting means Flyway manages schema migrations, not Hibernate `hbm2ddl`.

### 3.3 Flyway Database Migrations

Flyway migrations are located in `backend/src/main/resources/db/migration/`. On first startup, Flyway will automatically run all migrations in order (`V1__init.sql`, `V2__...`, etc.) to set up the schema.

If you need to reset the database (e.g., for testing):
```bash
# Stop the backend, then reset the DB
psql -U admin -d salary_management -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
# Restart the backend — Flyway will re-run all migrations
```

---

## Step 4: Run the Backend (Spring Boot)

### Option A: Using Maven Wrapper (Recommended)

```bash
cd backend
./mvnw spring-boot:run
```

### Option B: Using System Maven

```bash
cd backend
mvn spring-boot:run
```

### Option C: Build and Run JAR

```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/salary-management-0.0.1-SNAPSHOT.jar
```

The backend will start by default on **port 8080**. The API is accessible at:
```
http://localhost:8080/api/v1
```

Default dev credentials: `admin` / `admin`

---

## Step 5: Set Up the Frontend (Angular)

### 5.1 Install Dependencies

```bash
cd frontend
npm install
```

### 5.2 Run the Development Server

```bash
cd frontend
ng serve
# or
npm start
```

The frontend will start on **port 4200**:
```
http://localhost:4200
```

> **Tip:** If port 4200 is already in use, specify a different port:
> ```bash
> ng serve --port 4201
> ```

### 5.3 Typecheck & Lint

To check for TypeScript errors without starting the dev server:
```bash
npx tsc --noEmit
```

---

## Step 6: Run Tests (Optional)

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
ng test
```

---

## Step 7: Access the Application

| Service | URL |
|---------|-----|
| **Backend API** | http://localhost:8080/api/v1 |
| **Frontend** | http://localhost:4200 |

### API Endpoints

| Module | Endpoint |
|--------|----------|
| Departments | `/api/v1/departments` |
| Employees | `/api/v1/employees` |
| Pay Periods | `/api/v1/pay-periods` |
| Salary Records | `/api/v1/salary-records` |
| Users | `/api/v1/users` |
| Audit Logs | `/api/v1/audit` |

### Default Credentials

- Username: `admin`
- Password: `admin`

The backend includes a `DataInitializer` that seeds the database with default data on first run.

---

## Troubleshooting

### "Port 8080 is already in use"
```bash
lsof -i :8080 -t | xargs kill -9
```

### "Port 4200 is already in use"
```bash
lsof -i :4200 -t | xargs kill -9
```

### "Connection refused" when accessing the frontend
Make sure the backend is running. The frontend proxies API requests to `http://localhost:8080/api/v1`.

### "Role is not null" or database constraint errors
The database may need a reset. See Step 3.3.

### "User ID not loaded" when clicking Process
The current user endpoint (`/api/v1/users/me`) may not be returning the authenticated user. Ensure you are logged in.

### PostgreSQL connection errors
1. Confirm PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux).
2. Verify the database and user exist:
   ```bash
   psql -U admin -d salary_management -c "\dt"
   ```

### Flyway "already initialized" errors
If you see `Schema history table "flyway_schema_history" already contains...` errors:
```bash
# In psql
DROP TABLE IF EXISTS flyway_schema_history CASCADE;
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
# Restart the backend
```

---

## Optional: Ollama (AI Chatbot)

The frontend includes an AI chatbot component that can connect to a local Ollama instance. If you want the chatbot to work:

### Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Start Ollama and Pull a Model

```bash
ollama serve
ollama pull llama3.2:3b
```

> Ollama runs on `localhost:11434`. The frontend chatbot is configured to communicate with this endpoint automatically. If Ollama is not running, the chatbot will show an error message when you try to send a message.

**Note:** Ollama is optional. The core application (departments, employees, pay periods, salary records, audit) works fully without it.

---

## Step 8: Project Structure

```
SalaryManagement/
├── backend/                          # Spring Boot application
│   ├── src/main/java/
│   │   ├── com/.../entity/           # JPA entities
│   │   ├── com/.../repository/       # Spring Data JPA repositories
│   │   ├── com/.../controller/       # REST controllers
│   │   ├── com/.../service/          # Business services
│   │   ├── com/.../security/         # Security config, JWT
│   │   ├── com/.../audit/            # Audit logging (AOP aspect, listener)
│   │   └── com/.../SalaryManagementApplication.java
│   ├── src/main/resources/
│   │   ├── db/migration/             # Flyway migration scripts (V1, V2, ...)
│   │   ├── application.yml           # Spring config
│   │   └── data.sql                  # Optional seed data
│   └── pom.xml
├── frontend/                         # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── modules/              # Feature modules (departments, employees, etc.)
│   │   │   ├── shared/               # Shared components & services
│   │   │   └── auth/                 # Authentication
│   │   └── ...
│   ├── angular.json
│   └── package.json
├── .gitignore
└── AGENTS.md                         # Build & test commands
```




