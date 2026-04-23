import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('members')
  listMembers(@Req() req: ClerkRequest) {
    return this.membersService.listMembers(req.clerkPayload.sub);
  }

  @Delete('members/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Req() req: ClerkRequest, @Param('id') id: string) {
    return this.membersService.removeMember(req.clerkPayload.sub, id);
  }

  @Post('invitations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  inviteMember(@Req() req: ClerkRequest, @Body() dto: InviteMemberDto) {
    return this.membersService.inviteMember(
      req.clerkPayload.sub,
      dto.email,
      dto.role,
    );
  }

  @Get('invitations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  listInvitations(@Req() req: ClerkRequest) {
    return this.membersService.listInvitations(req.clerkPayload.sub);
  }

  @Delete('invitations/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelInvitation(@Req() req: ClerkRequest, @Param('id') id: string) {
    return this.membersService.cancelInvitation(req.clerkPayload.sub, id);
  }
}
