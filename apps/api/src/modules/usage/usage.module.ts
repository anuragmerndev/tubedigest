import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { UserSummary, User, Organization } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserSummary, User, Organization])],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
