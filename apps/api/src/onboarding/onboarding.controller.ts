import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { SkipTenant } from '../auth/skip-tenant.decorator';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('org')
  @SkipTenant()
  @HttpCode(HttpStatus.CREATED)
  async createOrg(@Req() req: ClerkRequest, @Body() dto: CreateOrgDto) {
    const clerkId = req.clerkPayload.sub;
    const { org, user } = await this.onboardingService.createOrg(clerkId, dto.name);
    return {
      org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
      user: { id: user.id, role: user.role, orgId: user.orgId },
    };
  }
}
