import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { SkipTenant } from './skip-tenant.decorator';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @SkipTenant()
  @HttpCode(HttpStatus.OK)
  async sync(@Req() req: ClerkRequest, @Body() dto: SyncUserDto) {
    const clerkId = req.clerkPayload.sub;
    const user = await this.authService.syncUser(clerkId, dto.email);
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };
  }
}
