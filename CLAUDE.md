# Auth API NestJS — Instrucciones para Claude Code

## Stack

- NestJS 11 + TypeScript
- Prisma 5.22.0 + PostgreSQL
- bcrypt para hashing de passwords
- class-validator + class-transformer para validaciones
- @nestjs/jwt para generación y verificación de tokens JWT

## Reglas

- Nunca modificar archivos de configuración (tsconfig.json, nest-cli.json, package.json)
- Nunca instalar dependencias sin pedido explícito
- Nunca agregar lógica no solicitada
- Los controllers no tienen lógica, solo llaman al service
- Siempre usar select explícito en Prisma para no exponer password
- Convención de imports: primero librerías externas, después internos

## Estructura de carpetas

src/
prisma/ → PrismaModule y PrismaService
auth/ → AuthModule, AuthController, AuthService
dto/ → DTOs de validación
app.module.ts
main.ts
