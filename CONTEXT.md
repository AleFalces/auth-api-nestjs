# Auth API NestJS — Estado del proyecto

## Fecha: 2026-06-07

## Contexto del plan

Soy Alexis, dev en reconversión con background en Henry Bootcamp 2022.
Plan de 4 meses para conseguir primer trabajo como backend dev JR.
Mes 1: migración Auth API Fastify → NestJS con aprendizaje profundo.
Metodología: modo profesor-alumno, sin sprint formal hasta el mes 2.
Regla clave: modo 1 de Claude Code (aprendizaje) — no delegar lógica de negocio.

## Stack

- NestJS 11 + TypeScript
- Prisma 5.22.0 + PostgreSQL en Docker
- bcrypt para hashing
- class-validator + class-transformer para validaciones
- @nestjs/jwt para tokens JWT

## Estado actual del proyecto

Repo: https://github.com/AleFalces/auth-api-nestjs
Branch actual: main

### Endpoints completados

- POST   /api/v1/auth/register ✅
- POST   /api/v1/auth/login ✅
- POST   /api/v1/auth/refresh ✅ (con rotación de refresh token)
- POST   /api/v1/auth/logout ✅
- POST   /api/v1/auth/logout-all ✅ (protegido con JwtAuthGuard, revoca todos los refresh tokens del usuario autenticado)
- GET    /api/v1/auth/me ✅ (protegido con JwtAuthGuard)
- GET    /api/v1/auth/admin ✅ (protegido con JwtAuthGuard + RolesGuard, rol ADMIN)
- GET    /api/v1/users/:id ✅ (ADMIN only)
- PATCH  /api/v1/users/:id ✅ (ADMIN only — actualiza name/email)
- DELETE /api/v1/users/:id ✅ (ADMIN only — 204 No Content)

### Endpoints pendientes

(ninguno por ahora — ver "Próximos pasos posibles")

## Estructura de archivos

src/
  prisma/
    prisma.module.ts
    prisma.service.ts
  auth/
    dto/
      register.dto.ts
      login.dto.ts
      refresh.dto.ts
    auth.controller.ts
    auth.service.ts
    auth.module.ts
    auth.service.spec.ts       → 12 tests (register, login, logout, refresh, me)
    jwt-auth.guard.ts          → verifica Bearer token, adjunta payload al request
    jwt-auth.guard.spec.ts     → 3 tests
    roles.guard.ts             → verifica rol requerido vía @Roles()
    roles.guard.spec.ts        → 3 tests
    roles.decorator.ts         → @Roles(...roles)
    current-user.decorator.ts  → @CurrentUser() extrae user del request
  users/
    dto/
      update-user.dto.ts       → name?, email? (ambos opcionales)
    users.controller.ts        → GET/PATCH/DELETE :id, todos ADMIN only
    users.service.ts           → findById, update, delete (con select explícito)
    users.service.spec.ts      → 6 tests
    users.module.ts
  app.module.ts
  main.ts → ValidationPipe global, Swagger en /docs

test/
  jest-e2e.json          → config de Jest para E2E (maxWorkers: 1, ver nota abajo)
  jest-e2e.setup.ts      → carga .env.test con dotenv antes de correr los specs
  auth.e2e-spec.ts       → 15 tests (register, login, me, refresh, logout, logout-all, admin)
  users.e2e-spec.ts      → 9 tests (GET/PATCH/DELETE :id — ADMIN, no-ADMIN, no existe)

## Tests

### Unitarios (mocks de Prisma/JwtService)

- auth.service.spec.ts: 13 tests
- jwt-auth.guard.spec.ts: 3 tests
- roles.guard.spec.ts: 3 tests
- users.service.spec.ts: 6 tests
- Total unitarios: 25 tests ✅

### E2E (HTTP real + Postgres real)

- auth.e2e-spec.ts: 15 tests
- users.e2e-spec.ts: 9 tests
- Total E2E: 24 tests ✅
- Corren contra una DB separada `auth_api_test` (mismo Postgres de Docker), configurada vía `.env.test`
- `npm run test:e2e` (script ya existía en package.json, apuntando a test/jest-e2e.json)

### Total general: 49 tests ✅

## CI/CD

- .github/workflows/ci.yml → corre typecheck + unit tests en cada push (incluye prisma generate)

## Documentación

- Swagger UI disponible en /docs
- Endpoints agrupados con @ApiTags ('auth', 'users')
- Rutas protegidas con @ApiBearerAuth (permite "Authorize" + probar desde la UI con el accessToken)
- DTOs documentados con @ApiProperty / @ApiPropertyOptional (examples, minLength, opcionalidad)

## Tokens

- Access token: JWT firmado, expira en 15 minutos. Payload: { sub, email, role }
- Refresh token: JWT firmado, expira en 30 días. Almacenado en DB. Rotación en cada uso.

## Decisiones técnicas tomadas

- Prisma 5.22.0 (no 7) por incompatibilidad con NestJS 11
- select explícito en todas las queries — nunca exponer password
- Mismo mensaje 'Invalid credentials' para usuario no encontrado y password incorrecto (evita user enumeration attack)
- Refresh token guardado en DB para poder invalidarlo en logout
- JwtAuthGuard custom (sin Passport) — implementa CanActivate directamente
- RolesGuard usa Reflector para leer metadata de @Roles()
- Guards registrados como providers en AuthModule
- E2E contra DB de test separada (auth_api_test), no contra la de desarrollo — evita contaminar datos y permite limpiar tablas entre tests sin riesgo
- jest-e2e.json con maxWorkers: 1 — los specs E2E comparten una sola DB; si Jest los corre en paralelo (default), sus afterEach (deleteMany) se pisan entre archivos y producen 500 aleatorios. Forzar ejecución serial los aísla
- Refresh token incluye claim jti (crypto.randomUUID()) — sin esto, dos tokens firmados con el mismo payload { sub } en el mismo segundo (mismo iat) daban el mismo string firmado, rompiendo la "rotación". Lo encontró el E2E de refresh, no los unitarios (ahí JwtService.sign está mockeado y devuelve siempre el mismo string)
- RolesGuard lee el rol desde el payload del JWT, no de la DB — promover a alguien a ADMIN no tiene efecto hasta que esa persona vuelva a loguearse (el rol viejo queda "congelado" en el access token vigente)

## Próximos pasos posibles

- Editar el README para GitHub con la documentación de la API (hoy es el README genérico que viene del starter de NestJS — falta describir endpoints, stack, cómo levantar el proyecto y correr los tests)

## Metodología de testing

- Un test a la vez: escribir un test → Red → implementar → Green → siguiente test

## Archivos de contexto

- CLAUDE.md → instrucciones permanentes para Claude Code
- context.md → este archivo, actualizar al inicio de cada sesión
