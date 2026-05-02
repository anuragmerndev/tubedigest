import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User, UserRole } from '../../database/entities';
import { DodoClientService } from '../billing/dodo-client.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dodo: DodoClientService,
  ) {}

  async createOrg(
    clerkId: string,
    name: string,
  ): Promise<{ org: Organization; user: User }> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user) {
      throw new NotFoundException('User not found — call /auth/sync first');
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.orgRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already taken`);
    }

    // Create Dodo customer so we can attach checkouts and usage events
    const dodoCustomer = await this.dodo.client.customers.create({
      email: user.email,
      name,
    });

    const org = this.orgRepo.create({
      name,
      slug,
      dodoCustomerId: dodoCustomer.customer_id,
    });
    const savedOrg = await this.orgRepo.save(org);

    user.orgId = savedOrg.id;
    user.role = UserRole.OWNER;
    const savedUser = await this.userRepo.save(user);

    return { org: savedOrg, user: savedUser };
  }
}
