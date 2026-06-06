import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = { verify: jest.fn() } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  const buildContext = (headers: Record<string, string> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as unknown as ExecutionContext;

  it('should throw UnauthorizedException if no authorization header', () => {
    expect(() => guard.canActivate(buildContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token is invalid', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    expect(() =>
      guard.canActivate(buildContext({ authorization: 'Bearer bad-token' })),
    ).toThrow(UnauthorizedException);
  });
});
