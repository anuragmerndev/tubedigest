import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get('current')
  async getCurrent(@Req() req: ClerkRequest) {
    return this.orgsService.getCurrentOrg(req.clerkPayload.sub);
  }

  @Patch('current')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  async updateCurrent(@Req() req: ClerkRequest, @Body() dto: UpdateOrgDto) {
    return this.orgsService.updateOrg(req.clerkPayload.sub, dto);
  }
}
