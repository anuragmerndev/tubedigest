import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Webhook } from 'svix';
import { createClerkClient } from '@clerk/backend';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SkipTenant } from './skip-tenant.decorator';
import { Public } from './public.decorator';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
  };
}

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @SkipTenant()
  @HttpCode(HttpStatus.OK)
  async sync(@Req() req: ClerkRequest) {
    const clerkId = req.clerkPayload.sub;
    const clerkUser = await this.clerk.users.getUser(clerkId);
    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
    return this.authService.syncUser(clerkId, email);
  }

  @Post('webhook')
  @Public()
  @SkipTenant()
  @HttpCode(HttpStatus.OK)
  async clerkWebhook(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    let event: ClerkUserEvent;
    try {
      event = wh.verify(JSON.stringify(body), {
        'svix-id': req.headers['svix-id'] as string,
        'svix-timestamp': req.headers['svix-timestamp'] as string,
        'svix-signature': req.headers['svix-signature'] as string,
      }) as ClerkUserEvent;
    } catch {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const { type, data } = event;
    const email = data.email_addresses?.[0]?.email_address ?? '';

    if (type === 'user.created' || type === 'user.updated') {
      await this.authService.syncUser(data.id, email);
    }

    if (type === 'user.deleted') {
      await this.authService.deleteUser(data.id);
    }

    return { received: true };
  }
}
