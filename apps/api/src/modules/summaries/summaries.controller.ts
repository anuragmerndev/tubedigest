import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SummariesService } from './summaries.service';
import { SubmitSummaryDto } from './dto/submit-summary.dto';

interface ClerkRequest {
  clerkPayload: { sub: string };
}

@ApiBearerAuth()
@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // 10 req/min per user
  submitSummary(@Req() req: ClerkRequest, @Body() dto: SubmitSummaryDto) {
    return this.summariesService.submitSummary(req.clerkPayload.sub, dto.url);
  }

  @Get()
  listSummaries(
    @Req() req: ClerkRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.summariesService.listSummaries(
      req.clerkPayload.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  getSummary(@Req() req: ClerkRequest, @Param('id') id: string) {
    return this.summariesService.getSummary(req.clerkPayload.sub, id);
  }
}
