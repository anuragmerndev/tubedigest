import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import { Invitation } from '../invitations/invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Invitation])],
  controllers: [MembersController],
  providers: [MembersService, RolesGuard],
})
export class MembersModule {}
