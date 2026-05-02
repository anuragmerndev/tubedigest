import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserSummary,
  User,
  Organization,
  OrgPlan,
} from '../../database/entities';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UserSummary)
    private readonly userSummaryRepo: Repository<UserSummary>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  private currentPeriod(): string {
    return new Date().toISOString().slice(0, 7); // "YYYY-MM"
  }

  /** Free tier lazy reset: reset credits on first usage of new month */
  private async maybeLazyReset(org: Organization): Promise<void> {
    const currentMonth = this.currentPeriod();
    if (org.plan === OrgPlan.FREE && org.creditResetPeriod !== currentMonth) {
      org.creditBalance = org.creditLimit;
      org.creditResetPeriod = currentMonth;
      await this.orgRepo.save(org);
    }
  }

  /** Check credit balance then atomically decrement. Throws 429 if no credits. */
  async checkAndIncrement(orgId: string): Promise<void> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    await this.maybeLazyReset(org);

    if (org.creditBalance <= 0) {
      throw new HttpException(
        'Monthly summary limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.orgRepo
      .createQueryBuilder()
      .update(Organization)
      .set({ creditBalance: () => 'credit_balance - 1' })
      .where('id = :id AND credit_balance > 0', { id: orgId })
      .execute();

    if (result.affected === 0) {
      throw new HttpException(
        'Monthly summary limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async getCurrentUsage(
    clerkId: string,
  ): Promise<{ count: number; limit: number; period: string }> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId)
      throw new NotFoundException('User or organisation not found');

    const org = await this.orgRepo.findOne({ where: { id: user.orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    await this.maybeLazyReset(org);

    return {
      count: org.creditLimit - org.creditBalance,
      limit: org.creditLimit,
      period: this.currentPeriod(),
    };
  }

  async getDailyUsage(
    clerkId: string,
  ): Promise<Array<{ date: string; count: number }>> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId)
      throw new NotFoundException('User or organisation not found');

    const period = this.currentPeriod();
    const start = new Date(`${period}-01T00:00:00.000Z`);
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );

    const rows = await this.userSummaryRepo
      .createQueryBuilder('us')
      .select("to_char(us.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('us.org_id = :orgId', { orgId: user.orgId })
      .andWhere('us.created_at >= :start', { start })
      .andWhere('us.created_at < :end', { end })
      .groupBy("to_char(us.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }));
  }
}
