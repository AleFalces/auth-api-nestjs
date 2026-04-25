# Estado actual del proyecto

## Fecha: 2026-04-23

## Lo que está funcionando

- NestJS instalado y configurado
- Prisma 5.22.0 conectado a PostgreSQL en Docker
- Migración `init` aplicada (tablas User y RefreshToken)
- docker-compose.yml configurado con postgres en puerto 5432

## Estado actual: 2026-04-23

- Todos los archivos reconstruidos con Claude Code
- Pendiente: verificar que el servidor levanta sin errores
- Pendiente: probar POST /api/v1/auth/register con Postman
- Pendiente: primer commit limpio a la branch feat/auth-register

## Lo que se reconstruyó

### src/main.ts

- NestFactory.create(AppModule)
- Puerto: process.env.PORT ?? 3000
- ValidationPipe global con whitelist: true y forbidNonWhitelisted: true

### src/app.module.ts

- Importa solo PrismaModule y AuthModule

### src/prisma/prisma.service.ts

- Extiende PrismaClient
- Implementa OnModuleInit con $connect()

### src/prisma/prisma.module.ts

- providers: [PrismaService]
- exports: [PrismaService]

### src/auth/dto/register.dto.ts

- email: @IsEmail()
- password: @MinLength(8)
- name: @IsString()

### src/auth/auth.service.ts

- Inyecta PrismaService
- Método register(dto: RegisterDto):
  - Busca usuario por email con findUnique
  - Si existe: throw ConflictException('Email already registered')
  - Hashea password con bcrypt.hash(dto.password, 10)
  - Crea usuario con prisma.user.create
  - Usa select explícito: id, email, name, role, isActive, createdAt
  - No devuelve password nunca

### src/auth/auth.controller.ts

- @Controller('api/v1/auth')
- Inyecta AuthService
- POST 'register' con @HttpCode(HttpStatus.CREATED)
- Recibe @Body() dto: RegisterDto
- Llama a authService.register(dto)

### src/auth/auth.module.ts

- controllers: [AuthController]
- providers: [AuthService]
- imports: [PrismaModule]

## Lo que NO hay que tocar

- tsconfig.json
- package.json
- prisma/schema.prisma
- docker-compose.yml
- .env
- .gitignore

# Auth API NestJS — Estado del proyecto

## Fecha: 2026-04-24

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
Branch actual: main (feat/auth-register ya mergeada)

### Endpoints completados

- POST /api/v1/auth/register ✅
  - Validaciones con class-validator
  - Hash de password con bcrypt
  - ConflictException si email duplicado
  - select explícito sin exponer password
  - Probado y funcionando en Postman

### Endpoints en curso

- POST /api/v1/auth/login 🔄
  - LoginDto creado ✅
  - JwtService instalado (@nestjs/jwt) ✅
  - Método login en AuthService: completo ✅
  - Endpoint en AuthController: completo ✅ (@HttpCode cambiado a HttpStatus.OK)
  - Pendiente: configurar JwtModule.register() en AuthModule con JWT_SECRET
  - Pendiente: verificar que JWT_SECRET existe en .env
  - Pendiente: probar en Postman

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
auth.controller.ts → @Controller('api/v1/auth')
auth.service.ts → register ✅, login ✅
auth.module.ts → imports PrismaModule, JwtModule (pendiente .register())
app.module.ts → imports PrismaModule, AuthModule
main.ts → ValidationPipe global

## Cambios pendientes para próxima sesión

- `auth.module.ts`: cambiar `JwtModule` por `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { algorithm: 'HS256' } })`
- Verificar que `.env` tiene `JWT_SECRET` definido
- Probar POST /api/v1/auth/login en Postman

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
