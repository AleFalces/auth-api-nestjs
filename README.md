# Auth API — NestJS

API REST de autenticación y gestión de usuarios construida con NestJS, Prisma y PostgreSQL. Incluye JWT con rotación de refresh tokens y control de acceso por roles.

> 🇪🇸 [Español](#español) · 🇬🇧 [English](#english)

---

## Español

### Stack

- NestJS 11 + TypeScript
- PostgreSQL + Prisma 5.22 (vía Docker)
- JWT (`@nestjs/jwt`) — access y refresh tokens
- bcrypt para hashing de contraseñas
- class-validator / class-transformer
- Jest — tests unitarios y end-to-end
- Swagger / OpenAPI

### Funcionalidades

- Registro y login con contraseñas hasheadas (bcrypt)
- Access token (15 min) + refresh token (30 días, persistido en DB, con rotación en cada uso)
- Logout (revoca el refresh token actual) y logout-all (revoca todos los del usuario)
- Guards propios (sin Passport): `JwtAuthGuard` para autenticación y `RolesGuard` para autorización por rol
- Gestión de usuarios solo para ADMIN: consultar, actualizar y eliminar
- Documentación interactiva con Swagger en `/docs`
- 49 tests automatizados (25 unitarios + 24 end-to-end contra Postgres real)

### Endpoints

| Método | Ruta                       | Descripción                          | Acceso         |
| ------ | -------------------------- | ------------------------------------ | -------------- |
| POST   | `/api/v1/auth/register`    | Registrar usuario                    | Público        |
| POST   | `/api/v1/auth/login`       | Iniciar sesión                       | Público        |
| POST   | `/api/v1/auth/refresh`     | Rotar refresh token                  | Refresh token  |
| POST   | `/api/v1/auth/logout`      | Revocar el refresh token actual      | Autenticado    |
| POST   | `/api/v1/auth/logout-all`  | Revocar todos los refresh tokens     | Autenticado    |
| GET    | `/api/v1/auth/me`          | Perfil del usuario autenticado       | Autenticado    |
| GET    | `/api/v1/auth/admin`       | Endpoint de prueba para rol ADMIN    | ADMIN          |
| GET    | `/api/v1/users/:id`        | Obtener usuario por id               | ADMIN          |
| PATCH  | `/api/v1/users/:id`        | Actualizar nombre / email            | ADMIN          |
| DELETE | `/api/v1/users/:id`        | Eliminar usuario                     | ADMIN          |

### Cómo levantar el proyecto

**Requisitos:** Node.js, pnpm y Docker.

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/AleFalces/auth-api-nestjs.git
cd auth-api-nestjs
pnpm install

# 2. Levantar PostgreSQL
docker compose up -d
```

Crear un archivo `.env` en la raíz:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_api?schema=public"
JWT_SECRET="tu-secreto"
```

```bash
# 3. Aplicar migraciones de Prisma
npx prisma migrate dev

# 4. Levantar el servidor en modo desarrollo
pnpm run start:dev
```

La API queda disponible en `http://localhost:3000/api/v1` y la documentación Swagger en `http://localhost:3000/docs`.

### Tests

49 tests automatizados: 25 unitarios (con Prisma y JwtService mockeados) y 24 end-to-end (HTTP real contra una base Postgres real).

```bash
pnpm run test       # unitarios
pnpm run test:cov   # con cobertura
pnpm run test:e2e   # end-to-end
```

Los tests E2E corren contra una base separada (`auth_api_test`) para no contaminar la base de desarrollo. Se configura en `.env.test`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_api_test?schema=public"
```

### Decisiones técnicas destacadas

- Mismo mensaje de error (`Invalid credentials`) para usuario inexistente o contraseña incorrecta, para evitar ataques de enumeración de usuarios
- Refresh tokens persistidos en base de datos, con rotación en cada uso y revocación posible (logout / logout-all)
- `JwtAuthGuard` y `RolesGuard` implementados desde cero (sin Passport), usando `Reflector` para leer metadata de `@Roles()`
- `select` explícito en todas las queries de Prisma para nunca exponer el campo `password`

### Autor

Alexis Falces — [GitHub](https://github.com/AleFalces)

---

## English

REST API for authentication and user management built with NestJS, Prisma and PostgreSQL. Features JWT auth with refresh token rotation and role-based access control.

### Stack

- NestJS 11 + TypeScript
- PostgreSQL + Prisma 5.22 (via Docker)
- JWT (`@nestjs/jwt`) — access and refresh tokens
- bcrypt for password hashing
- class-validator / class-transformer
- Jest — unit and end-to-end tests
- Swagger / OpenAPI

### Features

- Registration and login with hashed passwords (bcrypt)
- Access token (15 min) + refresh token (30 days, persisted in DB, rotated on every use)
- Logout (revokes the current refresh token) and logout-all (revokes all of the user's tokens)
- Custom guards (no Passport): `JwtAuthGuard` for authentication and `RolesGuard` for role-based authorization
- Admin-only user management: read, update and delete
- Interactive documentation with Swagger at `/docs`
- 49 automated tests (25 unit + 24 end-to-end against a real Postgres instance)

### Endpoints

| Method | Route                      | Description                       | Access         |
| ------ | -------------------------- | --------------------------------- | -------------- |
| POST   | `/api/v1/auth/register`    | Register a user                   | Public         |
| POST   | `/api/v1/auth/login`       | Log in                            | Public         |
| POST   | `/api/v1/auth/refresh`     | Rotate refresh token              | Refresh token  |
| POST   | `/api/v1/auth/logout`      | Revoke the current refresh token  | Authenticated  |
| POST   | `/api/v1/auth/logout-all`  | Revoke all refresh tokens         | Authenticated  |
| GET    | `/api/v1/auth/me`          | Authenticated user's profile      | Authenticated  |
| GET    | `/api/v1/auth/admin`       | Sample endpoint for the ADMIN role| ADMIN          |
| GET    | `/api/v1/users/:id`        | Get a user by id                  | ADMIN          |
| PATCH  | `/api/v1/users/:id`        | Update name / email               | ADMIN          |
| DELETE | `/api/v1/users/:id`        | Delete a user                     | ADMIN          |

### Getting started

**Requirements:** Node.js, pnpm and Docker.

```bash
# 1. Clone and install dependencies
git clone https://github.com/AleFalces/auth-api-nestjs.git
cd auth-api-nestjs
pnpm install

# 2. Start PostgreSQL
docker compose up -d
```

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_api?schema=public"
JWT_SECRET="your-secret"
```

```bash
# 3. Run Prisma migrations
npx prisma migrate dev

# 4. Start the dev server
pnpm run start:dev
```

The API is available at `http://localhost:3000/api/v1`, and the Swagger docs at `http://localhost:3000/docs`.

### Tests

49 automated tests: 25 unit tests (Prisma and JwtService mocked) and 24 end-to-end tests (real HTTP requests against a real Postgres database).

```bash
pnpm run test       # unit tests
pnpm run test:cov   # with coverage
pnpm run test:e2e   # end-to-end tests
```

E2E tests run against a separate database (`auth_api_test`) to avoid polluting the development database. Configure it in `.env.test`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_api_test?schema=public"
```

### Notable technical decisions

- Same error message (`Invalid credentials`) for both a non-existent user and a wrong password, to avoid user-enumeration attacks
- Refresh tokens persisted in the database, rotated on every use and revocable (logout / logout-all)
- `JwtAuthGuard` and `RolesGuard` built from scratch (no Passport), using `Reflector` to read `@Roles()` metadata
- Explicit `select` on every Prisma query so the `password` field is never exposed

### Author

Alexis Falces — [GitHub](https://github.com/AleFalces)
