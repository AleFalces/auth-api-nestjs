import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

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
        role: ' USER',
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
});
