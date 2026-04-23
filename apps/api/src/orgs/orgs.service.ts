import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

export interface UpdateOrgData {
  name?: string;
}

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getCurrentOrg(clerkId: string): Promise<Organization> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId) {
      throw new NotFoundException('No organisation found for this user');
    }
    const org = await this.orgRepo.findOne({ where: { id: user.orgId } });
    if (!org) {
      throw new NotFoundException('Organisation not found');
    }
    return org;
  }

  async updateOrg(clerkId: string, data: UpdateOrgData): Promise<Organization> {
    const org = await this.getCurrentOrg(clerkId);

    if (data.name) {
      org.name = data.name;
      org.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return this.orgRepo.save(org);
  }
}
