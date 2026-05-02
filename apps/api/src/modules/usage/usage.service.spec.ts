import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsageService } from './usage.service';
import {
  UserSummary,
  User,
  Organization,
  OrgPlan,
} from '../../database/entities';

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

const freeOrg = {
  id: 'org1',
  plan: OrgPlan.FREE,
  creditBalance: 10,
  creditLimit: 10,
  creditResetPeriod: period,
} as Organization;

describe('UsageService', () => {
  it('throws 429 when credits exhausted', async () => {
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue({
      ...freeOrg,
      creditBalance: 0,
    });

    const service = new UsageService(
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await expect(service.checkAndIncrement('org1')).rejects.toThrow(
      HttpException,
    );
  });

  it('decrements credit when under limit', async () => {
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue({ ...freeOrg, creditBalance: 7 });

    const mockExecute = jest.fn().mockResolvedValue({ affected: 1 });
    const mockWhere = jest.fn().mockReturnValue({ execute: mockExecute });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    orgRepo.createQueryBuilder.mockReturnValue({ update: mockUpdate });

    const service = new UsageService(
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await service.checkAndIncrement('org1');

    expect(mockExecute).toHaveBeenCalled();
  });

  it('throws 429 on atomic decrement race', async () => {
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    orgRepo.findOne.mockResolvedValue({ ...freeOrg, creditBalance: 1 });

    const mockExecute = jest.fn().mockResolvedValue({ affected: 0 });
    const mockWhere = jest.fn().mockReturnValue({ execute: mockExecute });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    orgRepo.createQueryBuilder.mockReturnValue({ update: mockUpdate });

    const service = new UsageService(
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await expect(service.checkAndIncrement('org1')).rejects.toThrow(
      HttpException,
    );
  });

  it('returns current usage for authenticated user', async () => {
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    userRepo.findOne.mockResolvedValue(user);
    orgRepo.findOne.mockResolvedValue({ ...freeOrg, creditBalance: 5 });

    const service = new UsageService(
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    const result = await service.getCurrentUsage('clerk_abc');

    expect(result).toEqual({ count: 5, limit: 10, period });
  });

  it('performs lazy reset for free tier in new month', async () => {
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const orgRepo = makeRepo<Organization>();
    const staleOrg = {
      ...freeOrg,
      creditBalance: 2,
      creditResetPeriod: '2025-01',
    };
    orgRepo.findOne.mockResolvedValue(staleOrg);
    orgRepo.save.mockResolvedValue(staleOrg);

    const mockExecute = jest.fn().mockResolvedValue({ affected: 1 });
    const mockWhere = jest.fn().mockReturnValue({ execute: mockExecute });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    orgRepo.createQueryBuilder.mockReturnValue({ update: mockUpdate });

    const service = new UsageService(
      summaryRepo.repo,
      userRepo.repo,
      orgRepo.repo,
    );
    await service.checkAndIncrement('org1');

    expect(orgRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        creditBalance: 10,
        creditResetPeriod: period,
      }),
    );
  });
});
