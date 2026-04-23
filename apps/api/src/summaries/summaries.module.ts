import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';
import { Video } from './video.entity';
import { UserSummary } from './user-summary.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Video, UserSummary, User])],
  controllers: [SummariesController],
  providers: [SummariesService],
})
export class SummariesModule {}
