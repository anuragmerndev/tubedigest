import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsageService } from './usage.service';
import { UsageRecord } from './usage-record.entity';
import { UserSummary } from '../summaries/user-summary.entity';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

function makeRepo<T extends object>() {
  const findOne = jest.fn();
  const create = jest.fn();
  const save = jest.fn();
  const increment = jest.fn();
  const createQueryBuilder = jest.fn();
  const repo = {
    findOne,
    create,
    save,
    increment,
    createQueryBuilder,
  } as unknown as Repository<T>;
  return { repo, findOne, create, save, increment, createQueryBuilder };
}

const user = { id: 'u1', clerkId: 'clerk_abc', orgId: 'org1' } as User;

const period = new Date().toISOString().slice(0, 7);

const freeOrg = { id: 'org1', plan: 'free' } as Organization;

describe('UsageService', () => {
  it('throws 429 when monthly limit is reached', async () => {
    const usageRepo = makeRepo<UsageRecord>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue(freeOrg);

    const record = {
      id: 'rec1',
      orgId: 'org1',
      period,
      count: 10,
      limit: 10,
    } as UsageRecord;
    usageRepo.findOne.mockResolvedValue(record);

    const service = new UsageService(
      usageRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await expect(service.checkAndIncrement('org1')).rejects.toThrow(
      HttpException,
    );
  });

  it('increments count when under limit', async () => {
    const usageRepo = makeRepo<UsageRecord>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue(freeOrg);

    const record = {
      id: 'rec1',
      orgId: 'org1',
      period,
      count: 3,
      limit: 10,
    } as UsageRecord;
    usageRepo.findOne.mockResolvedValue(record);
    usageRepo.increment.mockResolvedValue({ affected: 1 });

    const service = new UsageService(
      usageRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await service.checkAndIncrement('org1');

    expect(usageRepo.increment).toHaveBeenCalledWith(
      { id: 'rec1' },
      'count',
      1,
    );
  });

  it('creates a new record when none exists for the period', async () => {
    const usageRepo = makeRepo<UsageRecord>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue(freeOrg);

    const newRecord = {
      id: 'rec1',
      orgId: 'org1',
      period,
      count: 0,
      limit: 10,
    } as UsageRecord;
    usageRepo.findOne.mockResolvedValue(null);
    usageRepo.create.mockReturnValue(newRecord);
    usageRepo.save.mockResolvedValue(newRecord);
    usageRepo.increment.mockResolvedValue({ affected: 1 });

    const service = new UsageService(
      usageRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await service.checkAndIncrement('org1');

    expect(usageRepo.create).toHaveBeenCalledWith({
      orgId: 'org1',
      period,
      limit: 10,
    });
    expect(usageRepo.increment).toHaveBeenCalledWith(
      { id: 'rec1' },
      'count',
      1,
    );
  });

  it('returns current usage for authenticated user', async () => {
    const usageRepo = makeRepo<UsageRecord>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue(freeOrg);

    const record = {
      id: 'rec1',
      orgId: 'org1',
      period,
      count: 5,
      limit: 10,
    } as UsageRecord;
    userRepo.findOne.mockResolvedValue(user);
    usageRepo.findOne.mockResolvedValue(record);

    const service = new UsageService(
      usageRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    const result = await service.getCurrentUsage('clerk_abc');

    expect(result).toEqual({ count: 5, limit: 10, period });
  });
});
