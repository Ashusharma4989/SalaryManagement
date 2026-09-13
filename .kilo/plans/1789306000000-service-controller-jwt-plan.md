# Implementation Plan — Service Layer, REST Controllers, JWT Auth

## Goal & Scope
Expose the already-built entities/DTOs/repositories over a secured REST API by adding the missing **service** and **controller** layers plus **JWT authentication**. Add a minimal **frontend auth skeleton**. Full CRUD UI is explicitly **out of scope** (separate phase).

## Key Decisions (defaults — easy to override in review)
- **API base path**: `/api/v1` (proxy already routes `/api`).
- **RBAC**: `ROLE_ADMIN` = full CRUD incl. users; `ROLE_HR` = CRUD on departments/employees/pay-periods/salary-records/items, **read-only** on users; public = `POST /api/v1/auth/login`.
- **JWT**: HS256; secret from env `JWT_SECRET` (random per-startup fallback in dev w/ warning); 24h expiry (`app.jwt.expiration-ms=86400000`); `Authorization: Bearer <token>`.
- **Passwords**: BCrypt (`BCryptPasswordEncoder` bean).
- **Bootstrap**: Flyway `V2` seeds one `ROLE_ADMIN` user (documented dev password, precomputed BCrypt) so admin-only user creation is usable.
- **Transactions**: `@Transactional(readOnly=true)` at service class level; write overrides.
- **Salary calc**: `SalaryRecordService` auto-derives `gross = Σ(earning items)`, `totalDeductions = Σ(deduction items)`, `net = gross − totalDeductions` on create/update/item change.
- **Validation**: `@Valid` at controllers + business checks in services (uniqueness, pay-period-closed guards).
- **Packages**: `service`, `controller`, `security` (matches `LoggingAspect` pointcuts).
- **Login response**: raw `JwtResponse` (not wrapped in `ApiResponse`), for ergonomic client use.

## Phase 0 — pom cleanup (DONE)
- Removed stray `pom.xml.bak`, `pom_mapstruct.xml`.
- Removed duplicate `mapstruct-processor` `<scope>provided</scope>` dep (already only in `annotationProcessorPaths`).
- Fixed `spring-boot-starter-aop` → `spring-boot-starter-aspectj` (Spring Boot 4.x renamed it — **root cause of the original build break**; verified resolvable in 4.1.1 BOM).
- Removed unused `<spring-boot.version>` property.
- Verified: `./mvnw compile` → BUILD SUCCESS.

## Phase 1 — JWT security infrastructure
1. `config/SecurityConfig.java` — `SecurityFilterChain`: stateless sessions, CSRF disabled, CORS (existing `CorsConfig`), permit `POST /api/v1/auth/login` + actuator health/info, require auth elsewhere; register `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`.
2. `security/JwtTokenProvider.java` — sign/verify HS256, secret+expiry from config, `generateToken(UserDetails)`, `validateToken`, `getUsername`.
3. `security/JwtAuthenticationFilter.java` — `OncePerRequestFilter`; reads `Authorization: Bearer`; sets `SecurityContext`.
4. `security/UserDetailsServiceImpl.java` — loads `User` via `UserRepository.findByUsername`; maps `role` → `SimpleGrantedAuthority`.
5. `config/SecurityBeans.java` — `PasswordEncoder` (BCrypt) + `AuthenticationManager`.
6. DTOs: `dto/LoginRequest{username,password}`, `dto/JwtResponse{token,username,role}`, `dto/RegisterRequest{username,password,role,employeeId}`.
7. `controller/AuthController.java` — `POST /api/v1/auth/login` (public) → raw `JwtResponse`; `POST /api/v1/auth/register` (ADMIN only) → HR users only (never ADMIN).
8. `db/migration/v2__seed_admin_user.sql` — insert one seeded `ROLE_ADMIN` (documented dev password + precomputed BCrypt hash) tied to a seeded employee.
9. Add `app.jwt.secret`/`app.jwt.expiration-ms` to `application.yaml` (secret via env).

## Phase 2 — Service layer (`service/`)
`@Transactional(readOnly=true)` on each class; write methods `@Transactional`. Throw existing `ResourceNotFoundException` / `DuplicateResourceException` / `ValidationException`.
1. `DepartmentService` — CRUD; name uniqueness check.
2. `EmployeeService` — CRUD; byNumber/byEmail; uniqueness; resolve `Department` (404 if missing); EntityMapper.
3. `UserService` — `createForAuth(registration)` (hash password, persist HR user) used by register flow.
4. `PayPeriodService` — CRUD; by start/end; lifecycle `OPEN→CLOSED`; guarded transitions.
5. `SalaryRecordService` — CRUD with **auto-calc** of gross/deductions/net; add/remove item → recalc; `processedBy`; status `DRAFT→PROCESSED→POSTED`; find by employee / payPeriod.
6. `SalaryItemService` (or within RecordService) — add item: enforce `type∈{EARNING,DEDUCTION}`, recompute record totals.

## Phase 3 — REST controllers (`controller/`)
`@RestController`, `@RequestMapping("/api/v1/...")`, `@Valid` on bodies. Use `EntityMapper` (already written/correct). Return `ApiResponse.success(..)` (envelope already handled by `GlobalExceptionHandler`).
1. `DepartmentController` — list (paged), get, post, put, delete.
2. `EmployeeController` — list (with `departmentId` filter), get, post, put, delete.
3. `UserController` (`@PreAuthorize ADMIN`) — list, get, post (register HR), delete; never expose password (mapper ignores it).
4. `PayPeriodController` — list, get, post, put; `PATCH /{id}/status`.
5. `SalaryRecordController` — list, get, post, put; nested `POST /{id}/items`, `DELETE /{itemId}/items/{id}`; server-side totals; role-gated.
6. `AuthController` — from Phase 1.

## Phase 4 — Frontend auth skeleton (minimal)
`frontend/src/app/core/auth/`:
1. `auth.service.ts` — `login` POST `/api/v1/auth/login`, store JWT in `localStorage`; `logout`, `getToken`, `isAuthenticated`, `hasRole`.
2. `auth.interceptor.ts` — attach `Authorization: Bearer` header to `/api`.
3. `login.component.{ts,html,scss}` — login form → AuthService.
4. `auth.guard.ts` — `CanActivate` (auth; role checks where needed).
5. `app.config.ts` — register `HttpClientModule` + multi-provider interceptor; `app.routes.ts` add `/login` route + guard on rest.
6. Full CRUD UI components/deferred to later phase.

## Phase 5 — Validate
1. `./mvnw validate` + `./mvnw compile` succeed.
2. Postgres running; Flyway V1+V2 applied (`SELECT * FROM flyway_schema_history;` or startup logs).
3. Smoke: `curl -X POST http://localhost:8080/api/v1/auth/login -d '{"username":"admin","password":"<doc pw>"}'` → 200 + JWT.
4. `GET http://localhost:8080/api/v1/employees -H "Authorization: Bearer <jwt>"` → 200; no token → 401; expired token → 401.
5. `ROLE_HR` token cannot reach admin-only user endpoints (403).
6. `LoggingAspect` now traces controller/service (packages now exist).
7. `cd frontend && npx ng serve --proxy-config proxy.conf.json` → `/login` loads; interceptor sends token.

## Status
- **Backend**: implemented & running on `:8080` (devtools; frontend proxy `/api` → `localhost:8080` already configured; `AuthService`/interceptor/guard already scaffolded).
- **Backend — 3 bugs in BACKLOG** (deferred per user; frontend Phase 1 first):
  1. `ConcurrentModificationException` on salary-record create — Lombok `@Data` entity `hashCode()` dereferences lazy collection associations; `SalaryRecordService.addItems` `HashSet.add` → `PersistentSet.hashCode()`.
  2. Authenticated-but-role-denied (HR → `/api/v1/users`) returns **401** not **403** — `HttpStatusEntryPoint`/`AccessDeniedHandlerImpl` use `sendError`, triggering an internal `/error` dispatch that re-enters the chain as anonymous → 401.
  3. `EntityMapper.toSalaryRecordDTO` does not map `salaryItems`; `UserController` is GET/GET/{id}/DELETE only (no PUT).

## Frontend Implementation Plan
Stack: Angular 22, **standalone** components, **signals**, functional `authInterceptor` (present), `provideHttpClient`, SCSS — no Angular Material. Auth JWT handled by existing `AuthService` (localStorage).
Tables → future modules: `departments`, `employees`, `users`, `pay_periods`, `salary_records`, `salary_items` (see `db/salary_management.sql`).

### Phase 1 — Shared components + base service (current)
- `shared/services/api.service.ts` — generic `get/post/put/patch/delete` + `list<T>` normalizing Spring `Page` → `PagedResponse`. Single source for all DB ops.
- `shared/services/snack-bar.service.ts` — single-message signal; `success/error/warning/info`, auto-dismiss.
- `shared/components/snack-bar/snack-bar.{ts,html,scss}` — renders active message, auto-dismiss via `effect`, action button; mount `<app-snackbar/>` in `app.html` (+ add to `App.imports`).
- `shared/components/table/data-table.{ts,html,scss}` — inputs `columns` (`key/label/type?/sortable?/render?`), `rows`, `loading`, `total`, `pageIndex`, `pageSize`, `rowKey?`, `actions`; outputs `pageChange`, `rowClick`. Type formatters (number/currency/date/status), skeleton, empty state, mini pagination. Uses `ButtonComponent` for row actions.
- `shared/components/form/form-field.{ts,html,scss}` — wraps a `formControlName` with `label` + live validation errors (required/email/minlength/maxlength/pattern); reactive-forms aware.
- `shared/components/button/button.{ts,html,scss}` — `variant` (primary/secondary/danger/ghost), `type`, `loading` spinner, `disabled`, `icon`; selector `button[app-button]`.
Conventions: standalone, signals, `CommonModule` import, no Material.

### Phase 2 (next) — Table modules + services
Per table: `XxxService` (extends `ApiService`) + CRUD component using `DataTable`+`FormField`+`Button`; RBAC via `authGuard(['ADMIN'])` for `users`. `salary-records` adds nested `salary_items` + lifecycle buttons (process/post) + computed `gross/deductions/net` display.

### Phase 3 (next) — Routing + role menu
Add table routes to `app.routes.ts`; show `Users` nav link only for ADMIN (`app.html` `auth.hasRole('ADMIN')`).

## Risks / follow-ups (decide if disputed)
- Spring Security version under Boot 4.1.1 — confirm filter-chain DSL (`authorizeHttpRequests`).
- Login wrap: chose **raw JwtResponse** (not `ApiResponse`-wrapped).
- Refresh tokens, OAuth, full CRUD UI → separate phases.
