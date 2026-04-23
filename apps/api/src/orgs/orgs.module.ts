import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';
import { RolesGuard } from '../auth/roles.guard';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User])],
  controllers: [OrgsController],
  providers: [OrgsService, RolesGuard],
  exports: [OrgsService, RolesGuard],
})
export class OrgsModule {}
