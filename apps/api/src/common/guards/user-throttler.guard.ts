import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

interface ClerkRequest {
  clerkPayload?: { sub: string };
  ip?: string;
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const clerkReq = req as unknown as ClerkRequest;
    return Promise.resolve(
      clerkReq.clerkPayload?.sub ?? clerkReq.ip ?? 'anonymous',
    );
  }

  protected getRequestResponse(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ClerkRequest>();
    const res = context.switchToHttp().getResponse<Record<string, unknown>>();
    return {
      req: req as Record<string, unknown>,
      res: res,
    };
  }
}
