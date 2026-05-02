import { OnboardingService } from './onboarding.service';
import { Repository } from 'typeorm';
import { Organization, User, UserRole } from '../../database/entities';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DodoClientService } from '../billing/dodo-client.service';

function makeOrgRepo() {
  const findOne = jest.fn();
  const create = jest.fn();
  const save = jest.fn();
  const repo = { findOne, create, save } as unknown as Repository<Organization>;
  return { repo, findOne, create, save };
}

function makeUserRepo() {
  const findOne = jest.fn();
  const save = jest.fn();
  const repo = { findOne, save } as unknown as Repository<User>;
  return { repo, findOne, save };
}

const mockDodo = {
  client: {
    customers: {
      create: jest.fn().mockResolvedValue({ customer_id: 'cus_test123' }),
    },
  },
} as unknown as DodoClientService;

describe('OnboardingService', () => {
  it('throws NotFoundException when user not found', async () => {
    const orgRepo = makeOrgRepo();
    const userRepo = makeUserRepo();
    userRepo.findOne.mockResolvedValue(null);

    const service = new OnboardingService(
      orgRepo.repo,
      userRepo.repo,
      mockDodo,
    );
    await expect(service.createOrg('clerk_abc', 'Acme')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ConflictException when slug already exists', async () => {
    const orgRepo = makeOrgRepo();
    const userRepo = makeUserRepo();
    const user = {
      id: 'u1',
      clerkId: 'clerk_abc',
      orgId: null,
      email: 'a@b.com',
    } as User;
    userRepo.findOne.mockResolvedValue(user);
    orgRepo.findOne.mockResolvedValue({ id: 'existing-org' });

    const service = new OnboardingService(
      orgRepo.repo,
      userRepo.repo,
      mockDodo,
    );
    await expect(service.createOrg('clerk_abc', 'Acme')).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates org, sets user role to owner and orgId', async () => {
    const orgRepo = makeOrgRepo();
    const userRepo = makeUserRepo();
    const user = {
      id: 'u1',
      clerkId: 'clerk_abc',
      orgId: null,
      role: UserRole.MEMBER,
      email: 'a@b.com',
    } as User;
    const org = {
      id: 'org1',
      name: 'Acme',
      slug: 'acme',
      dodoCustomerId: 'cus_test123',
    };

    userRepo.findOne.mockResolvedValue(user);
    orgRepo.findOne.mockResolvedValue(null);
    orgRepo.create.mockReturnValue(org);
    orgRepo.save.mockResolvedValue(org);
    userRepo.save.mockResolvedValue({
      ...user,
      orgId: 'org1',
      role: UserRole.OWNER,
    });

    const service = new OnboardingService(
      orgRepo.repo,
      userRepo.repo,
      mockDodo,
    );
    const result = await service.createOrg('clerk_abc', 'Acme');

    expect(orgRepo.create).toHaveBeenCalledWith({
      name: 'Acme',
      slug: 'acme',
      dodoCustomerId: 'cus_test123',
    });
    expect(userRepo.save).toHaveBeenCalledWith({
      ...user,
      orgId: 'org1',
      role: UserRole.OWNER,
    });
    expect(result.org).toEqual(org);
  });
});
