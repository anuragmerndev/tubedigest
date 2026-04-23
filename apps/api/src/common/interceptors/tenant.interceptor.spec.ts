import { TenantInterceptor } from './tenant.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { of, throwError } from 'rxjs';

function makeQueryRunner(overrides: Record<string, jest.Mock> = {}) {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeDataSource(qr: ReturnType<typeof makeQueryRunner>) {
  return {
    createQueryRunner: jest.fn().mockReturnValue(qr),
  } as unknown as DataSource;
}

function makeReflector(isPublic: boolean) {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
  return reflector;
}

function makeContext(orgId: string | undefined) {
  const request = {
    clerkPayload: orgId ? { org_id: orgId } : undefined,
  };
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('TenantInterceptor', () => {
  it('skips RLS and passes through on public routes', async () => {
    const qr = makeQueryRunner();
    const interceptor = new TenantInterceptor(
      makeReflector(true),
      makeDataSource(qr),
    );
    const ctx = makeContext(undefined);
    const next = { handle: jest.fn().mockReturnValue(of('public-result')) };

    const result = await new Promise((resolve, reject) => {
      interceptor
        .intercept(ctx, next)
        .subscribe({ next: resolve, error: reject });
    });

    expect(result).toBe('public-result');
    expect(qr.connect).not.toHaveBeenCalled();
  });

  it('throws 401 when clerkPayload is missing on protected route', async () => {
    const qr = makeQueryRunner();
    const interceptor = new TenantInterceptor(
      makeReflector(false),
      makeDataSource(qr),
    );
    const ctx = makeContext(undefined);
    const next = { handle: jest.fn().mockReturnValue(of(null)) };

    await expect(
      new Promise((resolve, reject) => {
        interceptor
          .intercept(ctx, next)
          .subscribe({ next: resolve, error: reject });
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when org_id is missing from payload', async () => {
    const qr = makeQueryRunner();
    const interceptor = new TenantInterceptor(
      makeReflector(false),
      makeDataSource(qr),
    );
    const request = {
      clerkPayload: { sub: 'user_123' },
    };
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next = { handle: jest.fn().mockReturnValue(of(null)) };

    await expect(
      new Promise((resolve, reject) => {
        interceptor
          .intercept(ctx, next)
          .subscribe({ next: resolve, error: reject });
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('sets app.org_id and commits on success', async () => {
    const qr = makeQueryRunner();
    const interceptor = new TenantInterceptor(
      makeReflector(false),
      makeDataSource(qr),
    );
    const ctx = makeContext('org_abc');
    const next = { handle: jest.fn().mockReturnValue(of('result')) };

    await new Promise((resolve, reject) => {
      interceptor
        .intercept(ctx, next)
        .subscribe({ next: resolve, error: reject });
    });

    expect(qr.connect).toHaveBeenCalled();
    expect(qr.startTransaction).toHaveBeenCalled();
    expect(qr.query).toHaveBeenCalledWith(
      `SELECT set_config('app.org_id', $1, true)`,
      ['org_abc'],
    );
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
  });

  it('rollbacks and releases on handler error', async () => {
    const qr = makeQueryRunner();
    const interceptor = new TenantInterceptor(
      makeReflector(false),
      makeDataSource(qr),
    );
    const ctx = makeContext('org_abc');
    const next = {
      handle: jest.fn().mockReturnValue(throwError(() => new Error('boom'))),
    };

    await expect(
      new Promise((resolve, reject) => {
        interceptor
          .intercept(ctx, next)
          .subscribe({ next: resolve, error: reject });
      }),
    ).rejects.toThrow('boom');

    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
    expect(qr.commitTransaction).not.toHaveBeenCalled();
  });
});
