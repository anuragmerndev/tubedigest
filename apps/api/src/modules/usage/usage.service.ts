import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageRecord } from './usage-record.entity';
import { UserSummary } from '../summaries/user-summary.entity';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro: 100,
};

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageRecord)
    private readonly usageRepo: Repository<UsageRecord>,
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

  private async getOrCreate(orgId: string): Promise<UsageRecord> {
    const period = this.currentPeriod();
    const existing = await this.usageRepo.findOne({ where: { orgId, period } });
    if (existing) {
      // Sync limit if plan changed
      const limit = await this.getLimitForOrg(orgId);
      if (existing.limit !== limit) {
        existing.limit = limit;
        await this.usageRepo.save(existing);
      }
      return existing;
    }
    const limit = await this.getLimitForOrg(orgId);
    const record = this.usageRepo.create({ orgId, period, limit });
    return this.usageRepo.save(record);
  }

  private async getLimitForOrg(orgId: string): Promise<number> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    return PLAN_LIMITS[org?.plan ?? 'free'] ?? PLAN_LIMITS.free;
  }

  /** Check limit then atomically increment. Throws 429 if limit reached. */
  async checkAndIncrement(orgId: string): Promise<void> {
    const record = await this.getOrCreate(orgId);
    if (record.count >= record.limit) {
      throw new HttpException(
        'Monthly summary limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.usageRepo.increment({ id: record.id }, 'count', 1);
  }

  async getCurrentUsage(
    clerkId: string,
  ): Promise<{ count: number; limit: number; period: string }> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId)
      throw new NotFoundException('User or organisation not found');
    const record = await this.getOrCreate(user.orgId);
    return { count: record.count, limit: record.limit, period: record.period };
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
