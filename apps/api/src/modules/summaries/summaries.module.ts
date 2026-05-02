import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';
import { TranscriptService } from './transcript.service';
import {
  Video,
  UserSummary,
  User,
  Organization,
} from '../../database/entities';
import { UsageModule } from '../usage/usage.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, UserSummary, User, Organization]),
    UsageModule,
    BillingModule,
  ],
  controllers: [SummariesController],
  providers: [SummariesService, TranscriptService],
})
export class SummariesModule {}
