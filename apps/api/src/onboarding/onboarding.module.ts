import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User])],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
