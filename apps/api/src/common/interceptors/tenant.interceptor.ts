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

interface ClerkPayload {
  sub?: string;
  org_id?: string;
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

    if (isPublic) {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<{ clerkPayload?: ClerkPayload }>();

    const payload = request.clerkPayload;
    if (!payload) {
      return throwError(
        () => new UnauthorizedException('Missing auth payload'),
      );
    }

    const orgId = payload.org_id;
    if (!orgId) {
      return throwError(
        () => new UnauthorizedException('Missing org_id in token'),
      );
    }

    const qr = this.dataSource.createQueryRunner();

    return from(
      (async () => {
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
