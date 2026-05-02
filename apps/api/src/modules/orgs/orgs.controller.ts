import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@ApiBearerAuth()
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
