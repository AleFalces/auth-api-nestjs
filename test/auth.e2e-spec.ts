import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const credentials = {
  email: 'ale@example.com',
  password: 'MiPassword123!',
  name: 'Alexis',
};

async function registerAndLogin(app: INestApplication) {
  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(credentials)
    .expect(201);

  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: credentials.email, password: credentials.password })
    .expect(200);

  return response.body as { accessToken: string; refreshToken: string };
}

describe('Auth (e2e)', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return it without the password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
          name: 'Alexis',
        })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        email: 'ale@example.com',
        name: 'Alexis',
        role: 'USER',
        isActive: true,
        createdAt: expect.any(String),
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should return 409 Conflict when the email is already registered', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
          name: 'Alexis',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'ale@example.com',
          password: 'OtraPassword456!',
          name: 'Otro Alexis',
        })
        .expect(409);

      expect(response.body.message).toBe('Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return an access token and a refresh token for valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
          name: 'Alexis',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should return 401 with the same message for wrong password and unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
          name: 'Alexis',
        })
        .expect(201);

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'ale@example.com',
          password: 'PasswordIncorrecta1!',
        })
        .expect(401);

      const unknownEmail = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'no-existe@example.com',
          password: 'MiPassword123!',
        })
        .expect(401);

      expect(wrongPassword.body.message).toBe('Invalid credentials');
      expect(unknownEmail.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return the authenticated user when a valid access token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
          name: 'Alexis',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'ale@example.com',
          password: 'MiPassword123!',
        })
        .expect(200);

      const { accessToken } = loginResponse.body;

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        email: 'ale@example.com',
        name: 'Alexis',
        role: 'USER',
        isActive: true,
        createdAt: expect.any(String),
      });
    });

    it('should return 401 when no access token is provided', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate the refresh token and return a new token pair', async () => {
      const { refreshToken } = await registerAndLogin(app);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: refreshToken })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it('should reject the old refresh token after it has been rotated', async () => {
      const { refreshToken } = await registerAndLogin(app);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: refreshToken })
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: refreshToken })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 for a token that does not exist in the database', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: 'this-token-was-never-issued' })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke the refresh token so it can no longer be used', async () => {
      const { refreshToken } = await registerAndLogin(app);

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ token: refreshToken })
        .expect(204);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: refreshToken })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 for an unknown refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ token: 'this-token-was-never-issued' })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    it('should revoke every refresh token of the authenticated user across sessions', async () => {
      const sessionA = await registerAndLogin(app);

      const sessionBLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password })
        .expect(200);
      const sessionB = sessionBLogin.body as {
        accessToken: string;
        refreshToken: string;
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${sessionA.accessToken}`)
        .expect(204);

      const refreshA = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: sessionA.refreshToken })
        .expect(401);
      const refreshB = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ token: sessionB.refreshToken })
        .expect(401);

      expect(refreshA.body.message).toBe('Invalid refresh token');
      expect(refreshB.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 when no access token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout-all')
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/admin', () => {
    it('should return 403 Forbidden for an authenticated user without the ADMIN role', async () => {
      const { accessToken } = await registerAndLogin(app);

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/admin')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 200 for a user with the ADMIN role', async () => {
      await registerAndLogin(app);

      await prisma.user.update({
        where: { email: credentials.email },
        data: { role: 'ADMIN' },
      });

      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/admin')
        .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({ message: 'Admin access granted' });
    });
  });
});
