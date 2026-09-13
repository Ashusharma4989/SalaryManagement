# Salary Management — Developer README

A concise, step‑by‑step guide to set up and run the Salary Management monorepo (Spring Boot backend + Angular frontend + PostgreSQL).

---

## Quick Summary
- Backend: Java 17, Spring Boot 3.x (tested with 3.1+), Spring Data JPA, Flyway 9+, Spring Security
- Frontend: Angular 16+ (latest LTS), Node.js v24, Angular Material (recommended)
- Database: PostgreSQL 12+
- Repo layout:
  - `backend/` — Spring Boot app
  - `frontend/` — Angular app
  - `DB/` — manual SQL helper
  - `README.md` — this file

---

## Prerequisites (install before starting)
- Git
- Java JDK 17+ and `JAVA_HOME` set
- Maven (or use `./mvnw` wrapper included)
- Node.js v24 (use `nvm` to install/manage)
- npm (comes with Node)
- Angular CLI (optional; `npx` works)
- PostgreSQL 12+ (Postgres.app, EnterpriseDB, Homebrew, or Docker)
- pgAdmin (optional GUI)
- Recommended: `jq` for pretty curl output

---

## Environment (.env)
The repository includes `.env.example` as the canonical example for local development. Do not commit secrets.

Copy and edit before running services:
```bash
cp .env.example .env
# edit .env with your DB credentials and other secrets
set -a; source .env; set +a
```

---

## Database Setup

Option A — Manual (pgAdmin / psql)
- See `DB/salary_management.sql` for a single-run SQL helper.
- For automated migrations, see `backend/src/main/resources/db/migration/V1__init_schema.sql` (Flyway).

Create the database and role using your preferred tool (pgAdmin, psql, etc.). Do not hardcode credentials in the repo — put them in `.env` (see above).

Quick DB test (terminal) — use the credentials from your `.env`:
```bash
# Example (reads values from environment; adjust if you use a different shell/load strategy)
PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" psql -h localhost -U "$SPRING_DATASOURCE_USERNAME" -d salary_management -c "SELECT version();"
```

---

## Backend — Build & Run (dev)
1. Ensure `.env` loaded (see above).
2. From `backend/`:
```bash
cd backend
# Dev run with hot reload
./mvnw spring-boot:run
# OR build and run jar
./mvnw clean package -DskipTests
java -jar target/*.jar
```
3. Health check (if actuator enabled):
```bash
curl http://localhost:8080/actuator/health | jq .
```
Logs to watch:
- `HikariPool` start → DB connection OK
- `Flyway` → migrations applied
- Any `ERROR` / connection failures

Config is read from `backend/src/main/resources/application.yml` — it uses env placeholders so `.env` values are applied.

---

## Frontend — Dev & Production

Install Node (via nvm):
```bash
# install nvm (if not already)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
```

Create / Install (if not created):
```bash
cd <repo-root>
npx @angular/cli@latest new frontend --routing --style=scss --skip-git
cd frontend
npm install
npx ng add @angular/material
```

Dev server (proxy `/api` → backend)
- Create `frontend/proxy.conf.json`:
```json
{ "/api": { "target": "http://localhost:8080", "secure": false, "changeOrigin": true } }
```
- Run:
```bash
cd frontend
npx ng serve --proxy-config proxy.conf.json
# open http://localhost:4200
```

Production build + bundle into backend
```bash
# build
cd frontend
npm run build -- --configuration=production

# copy build into backend static folder
rm -rf ../backend/src/main/resources/static/*
cp -r dist/<project-name>/* ../backend/src/main/resources/static/

# package backend and run jar
cd ../backend
./mvnw clean package -DskipTests
java -jar target/*.jar
# open http://localhost:8080
```

Important: in frontend services use relative API paths (e.g., `/api/v1/employees`) so both proxy (dev) and same-origin (prod) work.

---

## Authentication (dev notes)
- Spring Security on classpath will enable default form-login.
- For quick dev access, set `SPRING_SECURITY_USER_NAME` and `SPRING_SECURITY_USER_PASSWORD` in `.env`.
- For production-quality auth, implement JWT:
  - Backend: JWT filter, `User` entity, `UserRepository`, `AuthController`
  - Frontend: `AuthService`, `AuthInterceptor` to attach `Authorization: Bearer <token>`

---

## Testing & Debugging
- Backend logs: `./mvnw spring-boot:run` output
- Actuator health: `http://localhost:8080/actuator/health`
- DB tables: `psql -c "\dt"`
- Frontend network: Browser DevTools → Network to inspect `/api` calls
- Common errors:
  - CORS error → use proxy or enable CORS in backend
  - DB connection fail → check `.env`, start Postgres, inspect `pg_isready`
  - Angular CLI Node version → use `nvm` to switch Node

---

## Security & Ops
- Never commit `.env` or secrets. Use environment variables or a secrets manager in production.
- Use HTTPS and secure cookie/localStorage strategies for tokens.
- Use Flyway for schema migrations and never edit an applied migration—add new migration files.

---

## Useful Commands Summary

Start DB (example using psql/pg_ctl depends on your installation):
```bash
# psql test
PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" psql -h localhost -U "$SPRING_DATASOURCE_USERNAME" -d salary_management -c "SELECT 1;"
# stop EnterpriseDB installation (example path)
sudo /Library/PostgreSQL/15/bin/pg_ctl -D /Library/PostgreSQL/15/data stop
```

Backend:
```bash
cd backend
set -a; source ../.env; set +a
./mvnw spring-boot:run
# or jar
./mvnw clean package -DskipTests
java -jar target/*.jar
```

Frontend (dev):
```bash
cd frontend
npx ng serve --proxy-config proxy.conf.json
```

Frontend (prod build + bundle):
```bash
cd frontend
npm run build -- --configuration=production
cp -r dist/<project>/* ../backend/src/main/resources/static/
cd ../backend
./mvnw clean package -DskipTests
java -jar target/*.jar
```

---

## Where to Next (recommended)
1. Create `.env` with DB credentials.  
2. Create DB role + database (pgAdmin or psql).  
3. Start backend and confirm Flyway applied migrations.  
4. Start frontend dev server with proxy and confirm UI calls succeed.  
5. Implement JWT auth and frontend login flow.

---

If you want, I will:
- populate `README.md` in the repo (done), and/or
- generate the frontend auth skeleton (`AuthService`, `AuthInterceptor`, `Login` component), and/or
- create a small `scripts/` helper to automate copy of `dist` into backend static.

Which of these should I do next?
