import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }

  @Get('protected')
  @ApiBearerAuth()
  protected() {
    return { status: 'reached' };
  }
}
