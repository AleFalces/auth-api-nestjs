# Auth API NestJS — Estado del proyecto

## Fecha: 2026-06-05

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
  - Validaciones con class-validator
  - Hash de password con bcrypt
  - ConflictException si email duplicado
  - select explícito sin exponer password
  - Probado y funcionando en Postman

- POST /api/v1/auth/login ✅
  - LoginDto creado
  - Método login en AuthService completo
  - Endpoint en AuthController completo (@HttpCode HttpStatus.OK)
  - JwtModule.register() configurado en AuthModule con JWT_SECRET
  - Access token: 15min, Refresh token: 30 días
  - RefreshToken guardado en DB
  - Pendiente: verificar JWT_SECRET en .env y probar en Postman

### Endpoints pendientes

- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- GET /api/v1/users/:id
- PATCH /api/v1/users/:id
- DELETE /api/v1/users/:id

## Estructura de archivos

src/
  prisma/
    prisma.module.ts → providers + exports PrismaService
    prisma.service.ts → extends PrismaClient, OnModuleInit
  auth/
    dto/
      register.dto.ts → IsEmail, MinLength(8), IsString
      login.dto.ts → IsEmail, MinLength(8)
    auth.controller.ts → @Controller('api/v1/auth'), register + login
    auth.service.ts → register ✅, login ✅
    auth.module.ts → imports PrismaModule, JwtModule.register() ✅
    auth.service.spec.ts → tests register ✅, tests login (parcial, falta happy path)
  app.module.ts → imports PrismaModule, AuthModule
  main.ts → ValidationPipe global

## Próximos pasos

1. Verificar que `.env` tiene `JWT_SECRET` definido
2. Probar POST /api/v1/auth/login en Postman
3. Completar test del happy path del login en auth.service.spec.ts
4. Implementar POST /api/v1/auth/refresh

## Metodología de testing

- Un test a la vez: escribir un test → Red → implementar → Green → siguiente test
- No escribir múltiples tests juntos antes de implementar

## Pendientes (más adelante)

- Integration testing: tests contra la DB real de Docker (no mockeada)
  → Requiere setup separado, archivo e2e, DB de test levantada

## Decisiones técnicas tomadas

- Prisma 5.22.0 (no 7) por incompatibilidad con NestJS 11
- Sin output personalizado en Prisma — usa @prisma/client directo
- select explícito en todas las queries — nunca exponer password
- Mismo mensaje 'Invalid credentials' para usuario no encontrado
  y password incorrecto (evita user enumeration attack)
- Refresh token guardado en DB para poder invalidarlo en logout
- Access token: 15min, Refresh token: 30 días

## Conceptos aprendidos hasta acá

- Módulos, Controllers, Services, DI en NestJS
- Por qué @Injectable() y no @Service()
- Por qué el constructor vacío con private readonly
- Por qué PrismaModule tiene exports y HelloModule no
- Por qué dos tokens (access corto + refresh largo)
- User enumeration attack
- bcrypt.compare() vs hashear y comparar
- select explícito en Prisma vs borrar campo después

## Archivos de contexto

- CLAUDE.md → instrucciones permanentes para Claude Code
- CONTEXT.md → este archivo, actualizar al inicio de cada sesión
