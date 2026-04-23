import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';
import { IS_PUBLIC_KEY } from '../../auth/public.decorator';
import { SKIP_TENANT_KEY } from '../../auth/skip-tenant.decorator';

interface ClerkPayload {
  sub?: string;
  [key: string]: unknown;
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || skipTenant) {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<{ clerkPayload?: ClerkPayload }>();

    const clerkId = request.clerkPayload?.sub;
    if (!clerkId) {
      return throwError(
        () => new UnauthorizedException('Missing auth payload'),
      );
    }

    const qr = this.dataSource.createQueryRunner();

    return from(
      (async () => {
        // Resolve org_id from local DB using the Clerk user id
        const rows = await this.dataSource.query<{ org_id: string | null }[]>(
          `SELECT org_id FROM users WHERE clerk_id = $1 LIMIT 1`,
          [clerkId],
        );
        const orgId = rows[0]?.org_id ?? null;
        if (!orgId) {
          throw new UnauthorizedException('User has no organisation');
        }
        await qr.connect();
        await qr.startTransaction();
        await qr.query(`SELECT set_config('app.org_id', $1, true)`, [orgId]);
      })(),
    ).pipe(
      switchMap(() => next.handle()),
      switchMap((value: unknown) =>
        from(
          (async (): Promise<unknown> => {
            await qr.commitTransaction();
            await qr.release();
            return value;
          })(),
        ),
      ),
      catchError((err: unknown) =>
        from(
          (async () => {
            await qr.rollbackTransaction();
            await qr.release();
            throw err;
          })(),
        ),
      ),
    );
  }
}
