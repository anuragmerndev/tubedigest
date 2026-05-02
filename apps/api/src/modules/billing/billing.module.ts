import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { DodoClientService } from './dodo-client.service';
import { Subscription, Organization, User } from '../../database/entities';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Organization, User])],
  controllers: [BillingController],
  providers: [BillingService, DodoClientService, RolesGuard],
  exports: [DodoClientService],
})
export class BillingModule {}
