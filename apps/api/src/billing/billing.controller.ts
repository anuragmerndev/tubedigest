import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { Public } from '../auth/public.decorator';
import { SkipTenant } from '../auth/skip-tenant.decorator';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  async getSubscription(@Req() req: ClerkRequest) {
    return this.billingService.getSubscription(req.clerkPayload.sub);
  }

  @Post('checkout')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  async createCheckout(@Req() req: ClerkRequest) {
    return this.billingService.createCheckout(req.clerkPayload.sub);
  }

  @Post('portal')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  async getBillingPortal(@Req() req: ClerkRequest) {
    return this.billingService.getBillingPortal(req.clerkPayload.sub);
  }

  @Post('webhook')
  @Public()
  @SkipTenant()
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request & { rawBody?: Buffer }) {
    await this.billingService.handleWebhook(req.rawBody!, req.headers);
    return { received: true };
  }
}
