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
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
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
