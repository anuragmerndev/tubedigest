import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { RolesGuard } from '../auth/roles.guard';
import { User, Invitation, Organization } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Invitation, Organization])],
  controllers: [MembersController],
  providers: [MembersService, RolesGuard],
})
export class MembersModule {}
