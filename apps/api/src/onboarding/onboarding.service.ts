import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createOrg(
    clerkId: string,
    name: string,
  ): Promise<{ org: Organization; user: User }> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user) {
      throw new NotFoundException('User not found — call /auth/sync first');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await this.orgRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already taken`);
    }

    const org = this.orgRepo.create({ name, slug });
    const savedOrg = await this.orgRepo.save(org);

    user.orgId = savedOrg.id;
    user.role = UserRole.OWNER;
    const savedUser = await this.userRepo.save(user);

    return { org: savedOrg, user: savedUser };
  }
}
