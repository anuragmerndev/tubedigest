import { Controller, Get, Req } from '@nestjs/common';
import { UsageService } from './usage.service';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('current')
  getCurrentUsage(@Req() req: ClerkRequest) {
    return this.usageService.getCurrentUsage(req.clerkPayload.sub);
  }

  @Get('daily')
  getDailyUsage(@Req() req: ClerkRequest) {
    return this.usageService.getDailyUsage(req.clerkPayload.sub);
  }
}
