import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface ClerkRequest extends Request {
  clerkPayload?: { sub: string; org_id?: string };
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: ClerkRequest, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;

      this.logger.log({
        method,
        url: originalUrl,
        statusCode,
        responseTimeMs: ms,
        userId: req.clerkPayload?.sub ?? null,
        orgId: req.clerkPayload?.org_id ?? null,
      });
    });

    next();
  }
}
