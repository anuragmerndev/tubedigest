import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

const mockVerifyToken = jest.fn();

jest.mock('@clerk/backend', () => ({
  verifyToken: (...args: unknown[]): unknown => mockVerifyToken(...args),
}));

function makeRequest(authHeader?: string) {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    clerkPayload: undefined as unknown,
  };
}

function makeContext(
  request: ReturnType<typeof makeRequest>,
  isPublic: boolean,
  reflector: Reflector,
): ExecutionContext {
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthGuard(reflector);
    mockVerifyToken.mockReset();
  });

  it('allows public routes without a token', async () => {
    const request = makeRequest();
    const ctx = makeContext(request, true, reflector);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('throws 401 when Authorization header is missing on protected route', async () => {
    const request = makeRequest();
    const ctx = makeContext(request, false, reflector);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when token is not Bearer scheme', async () => {
    const request = makeRequest('Basic abc123');
    const ctx = makeContext(request, false, reflector);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when token verification fails', async () => {
    mockVerifyToken.mockRejectedValue(new Error('invalid token'));
    const request = makeRequest('Bearer bad-token');
    const ctx = makeContext(request, false, reflector);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches payload and returns true on valid token', async () => {
    const payload = { sub: 'user_123', org_id: 'org_456' };
    mockVerifyToken.mockResolvedValue(payload);
    const request = makeRequest('Bearer valid-token');
    const ctx = makeContext(request, false, reflector);

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(request.clerkPayload).toEqual(payload);
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  });
});
