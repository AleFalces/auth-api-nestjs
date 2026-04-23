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
