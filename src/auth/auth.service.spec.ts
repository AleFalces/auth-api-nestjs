import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'ale@example.com',
      });

      await expect(
        service.register({
          email: 'ale@example.com',
          password: 'MiPassword123!',
          name: 'Alexis',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a user and return data without password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      prisma.user.create.mockResolvedValue({
        id: 'cuid-465',
        email: 'nuevo@example.com',
        name: 'Nuevo',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'nuevo@example.com',
        password: 'MiPassword123',
        name: 'Nuevo',
      });
      expect(result.email).toBe('nuevo@example.com');
      expect(result).not.toHaveProperty('password');
    });
  });
  describe('login', () => {
    it('should throw UnauthorizedException if email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'ale@example.com',
          password: 'MiPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'cuid-123',
        email: 'ale@example.com',
        password: 'hashed-password',
        role: 'USER',
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'ale@example.com',
          password: 'password-incorrecto',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken and refreshToken when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'cuid-123',
        email: 'ale@example.com',
        password: 'hashed-password',
        role: 'USER',
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'ale@example.com',
        password: 'MiPassword123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should throw UnauthorizedException if refresh token does not exist', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete the refresh token and return nothing', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'valid-token',
        userId: 'cuid-123',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      prisma.refreshToken.delete.mockResolvedValue({});

      const result = await service.logout('valid-token');

      expect(result).toBeUndefined();
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
      });
    });
  });

  describe('logoutAll', () => {
    it('should delete all refresh tokens belonging to the user', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.logoutAll('cuid-123');

      expect(result).toBeUndefined();
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'cuid-123' },
      });
    });
  });

  describe('me', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.me('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user data without password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'cuid-123',
        email: 'ale@example.com',
        name: 'Alexis',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.me('cuid-123');

      expect(result.email).toBe('ale@example.com');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if refresh token does not exist', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'valid-token',
        userId: 'cuid-123',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new accessToken and refreshToken and delete the old one', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'valid-token',
        userId: 'cuid-123',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      prisma.user.findUnique.mockResolvedValue({
        id: 'cuid-123',
        email: 'ale@example.com',
        role: 'USER',
      });

      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
      });
    });
  });
});
