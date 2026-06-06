import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  const buildContext = (role: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  it('should return true if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);

    const result = guard.canActivate(buildContext('USER'));

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext('USER'))).toThrow(
      ForbiddenException,
    );
  });

  it('should return true if user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const result = guard.canActivate(buildContext('ADMIN'));

    expect(result).toBe(true);
  });
});
