import { OrgsService } from './orgs.service';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { NotFoundException } from '@nestjs/common';

function makeOrgRepo() {
  const findOne = jest.fn();
  const save = jest.fn();
  const repo = { findOne, save } as unknown as Repository<Organization>;
  return { repo, findOne, save };
}

function makeUserRepo() {
  const findOne = jest.fn();
  const repo = { findOne } as unknown as Repository<User>;
  return { repo, findOne };
}

describe('OrgsService', () => {
  it('returns the org for the authenticated user', async () => {
    const orgRepo = makeOrgRepo();
    const userRepo = makeUserRepo();
    const user = { id: 'u1', clerkId: 'clerk_abc', orgId: 'org1' } as User;
    const org = { id: 'org1', name: 'Acme', slug: 'acme', plan: 'free' };

    userRepo.findOne.mockResolvedValue(user);
    orgRepo.findOne.mockResolvedValue(org);

    const service = new OrgsService(orgRepo.repo, userRepo.repo);
    const result = await service.getCurrentOrg('clerk_abc');

    expect(orgRepo.findOne).toHaveBeenCalledWith({ where: { id: 'org1' } });
    expect(result).toEqual(org);
  });

  it('throws NotFoundException when user has no org', async () => {
    const orgRepo = makeOrgRepo();
    const userRepo = makeUserRepo();
    userRepo.findOne.mockResolvedValue({ id: 'u1', orgId: null } as User);

    const service = new OrgsService(orgRepo.repo, userRepo.repo);
    await expect(service.getCurrentOrg('clerk_abc')).rejects.toThrow(NotFoundException);
  });

  it('updates org name and slug', async () => {
    const orgRepo = makeOrgRepo();
    const userRepo = makeUserRepo();
    const user = { id: 'u1', clerkId: 'clerk_abc', orgId: 'org1' } as User;
    const org = { id: 'org1', name: 'Old', slug: 'old', plan: 'free' } as Organization;
    const updated = { ...org, name: 'New Name', slug: 'new-name' };

    userRepo.findOne.mockResolvedValue(user);
    orgRepo.findOne.mockResolvedValue(org);
    orgRepo.save.mockResolvedValue(updated);

    const service = new OrgsService(orgRepo.repo, userRepo.repo);
    const result = await service.updateOrg('clerk_abc', { name: 'New Name' });

    expect(orgRepo.save).toHaveBeenCalledWith({ ...org, name: 'New Name', slug: 'new-name' });
    expect(result).toEqual(updated);
  });
});
