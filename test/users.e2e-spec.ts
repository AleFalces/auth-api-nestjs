import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const password = 'MiPassword123!';

async function registerUser(app: INestApplication, email: string, name: string) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email, password, name })
    .expect(201);

  return response.body as {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
}

async function login(app: INestApplication, email: string) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.accessToken as string;
}

async function createAdmin(app: INestApplication, prisma: PrismaService) {
  const admin = await registerUser(app, 'admin@example.com', 'Admin');

  await prisma.user.update({
    where: { id: admin.id },
    data: { role: 'ADMIN' },
  });

  const accessToken = await login(app, admin.email);

  return { ...admin, accessToken };
}

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return the user when requested by an ADMIN', async () => {
      const admin = await createAdmin(app, prisma);
      const target = await registerUser(app, 'user@example.com', 'Target User');

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: target.id,
        email: 'user@example.com',
        name: 'Target User',
        role: 'USER',
        isActive: true,
        createdAt: expect.any(String),
      });
    });

    it('should return 403 Forbidden when requested by a non-ADMIN user', async () => {
      const requester = await registerUser(app, 'user@example.com', 'Plain User');
      const accessToken = await login(app, requester.email);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${requester.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 404 when the user does not exist', async () => {
      const admin = await createAdmin(app, prisma);

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update the user when requested by an ADMIN', async () => {
      const admin = await createAdmin(app, prisma);
      const target = await registerUser(app, 'user@example.com', 'Target User');

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Updated Name', email: 'updated@example.com' })
        .expect(200);

      expect(response.body).toEqual({
        id: target.id,
        email: 'updated@example.com',
        name: 'Updated Name',
        role: 'USER',
        isActive: true,
        createdAt: expect.any(String),
      });
    });

    it('should return 403 Forbidden when requested by a non-ADMIN user', async () => {
      const requester = await registerUser(app, 'user@example.com', 'Plain User');
      const accessToken = await login(app, requester.email);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${requester.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Hacked Name' })
        .expect(403);

      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 404 when the user does not exist', async () => {
      const admin = await createAdmin(app, prisma);

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Ghost' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete the user when requested by an ADMIN', async () => {
      const admin = await createAdmin(app, prisma);
      const target = await registerUser(app, 'user@example.com', 'Target User');

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/users/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(404);
    });

    it('should return 403 Forbidden when requested by a non-ADMIN user', async () => {
      const requester = await registerUser(app, 'user@example.com', 'Plain User');
      const accessToken = await login(app, requester.email);

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${requester.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 404 when the user does not exist', async () => {
      const admin = await createAdmin(app, prisma);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });
});
