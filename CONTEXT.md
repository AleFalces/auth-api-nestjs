# Auth API NestJS — Estado del proyecto

## Fecha: 2026-06-06

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

- POST /api/v1/auth/register ✅
- POST /api/v1/auth/login ✅
- POST /api/v1/auth/refresh ✅ (con rotación de refresh token)
- POST /api/v1/auth/logout ✅
- GET  /api/v1/auth/me ✅ (protegido con JwtAuthGuard)
- GET  /api/v1/auth/admin ✅ (protegido con JwtAuthGuard + RolesGuard, rol ADMIN)

### Endpoints pendientes

- GET    /api/v1/users/:id
- PATCH  /api/v1/users/:id
- DELETE /api/v1/users/:id

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
  app.module.ts
  main.ts → ValidationPipe global

## Tests

- auth.service.spec.ts: 12 tests
- jwt-auth.guard.spec.ts: 3 tests
- roles.guard.spec.ts: 3 tests
- Total: 18 tests ✅

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

## Próximos pasos posibles

- E2E tests (flujo completo contra DB real)
- Swagger / OpenAPI
- UsersModule: GET/PATCH/DELETE /api/v1/users/:id
- Logout all: revocar todos los refresh tokens de un usuario

## Metodología de testing

- Un test a la vez: escribir un test → Red → implementar → Green → siguiente test

## Archivos de contexto

- CLAUDE.md → instrucciones permanentes para Claude Code
- context.md → este archivo, actualizar al inicio de cada sesión
