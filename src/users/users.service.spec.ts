import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findById', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
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

      const result = await service.findById('cuid-123');

      expect(result.email).toBe('ale@example.com');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return user data without password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'cuid-123' });
      prisma.user.update.mockResolvedValue({
        id: 'cuid-123',
        email: 'ale@example.com',
        name: 'Nombre Actualizado',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.update('cuid-123', { name: 'Nombre Actualizado' });

      expect(result.name).toBe('Nombre Actualizado');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete the user and return nothing', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'cuid-123' });
      prisma.user.delete.mockResolvedValue({});

      const result = await service.delete('cuid-123');

      expect(result).toBeUndefined();
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'cuid-123' },
      });
    });
  });
});
