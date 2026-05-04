import { AuthService } from './auth.service';
import { Repository, DataSource } from 'typeorm';
import {
  User,
  UserRole,
  Invitation,
  Organization,
} from '../../database/entities';

function makeRepo<T extends object>() {
  const findOne = jest.fn();
  const save = jest.fn();
  const create = jest.fn();
  const repo = { findOne, save, create } as unknown as Repository<T>;
  return { repo, findOne, save, create };
}

function makeDataSource(queryResult: unknown[] = []) {
  const query = jest.fn().mockResolvedValue(queryResult);
  const startTransaction = jest.fn().mockResolvedValue(undefined);
  const commitTransaction = jest.fn().mockResolvedValue(undefined);
  const rollbackTransaction = jest.fn().mockResolvedValue(undefined);
  const release = jest.fn().mockResolvedValue(undefined);
  const connect = jest.fn().mockResolvedValue(undefined);
  const qr = {
    connect,
    query,
    startTransaction,
    commitTransaction,
    rollbackTransaction,
    release,
  };
  const createQueryRunner = jest.fn().mockReturnValue(qr);
  const dataSource = { createQueryRunner } as unknown as DataSource;
  return { dataSource, qr, query };
}

describe('AuthService', () => {
  it('creates a new user when clerk_id not found', async () => {
    const { repo: userRepo, findOne, create, save } = makeRepo<User>();
    const { repo: invRepo } = makeRepo<Invitation>();
    const { repo: orgRepo } = makeRepo<Organization>();
    const { dataSource } = makeDataSource([]);

    const service = new AuthService(userRepo, invRepo, orgRepo, dataSource);
    const newUser = {
      id: 'uuid-1',
      clerkId: 'clerk_abc',
      email: 'a@b.com',
      role: UserRole.MEMBER,
      orgId: null,
    } as User;

    findOne.mockResolvedValue(null);
    create.mockReturnValue(newUser);
    save.mockResolvedValue(newUser);

    const result = await service.syncUser('clerk_abc', 'a@b.com');

    expect(findOne).toHaveBeenCalledWith({ where: { clerkId: 'clerk_abc' } });
    expect(create).toHaveBeenCalledWith({
      clerkId: 'clerk_abc',
      email: 'a@b.com',
    });
    expect(save).toHaveBeenCalledWith(newUser);
    expect(result.id).toEqual(newUser.id);
    expect(result.clerkId).toEqual(newUser.clerkId);
    expect(result.invitation).toBeNull();
  });

  it('updates email and returns existing user when clerk_id found', async () => {
    const { repo: userRepo, findOne, create, save } = makeRepo<User>();
    const { repo: invRepo } = makeRepo<Invitation>();
    const { repo: orgRepo } = makeRepo<Organization>();
    const { dataSource } = makeDataSource([]);

    const service = new AuthService(userRepo, invRepo, orgRepo, dataSource);
    const existing = {
      id: 'uuid-1',
      clerkId: 'clerk_abc',
      email: 'old@b.com',
      role: UserRole.MEMBER,
      orgId: null,
    } as User;
    const updated = { ...existing, email: 'new@b.com' };

    findOne.mockResolvedValue(existing);
    save.mockResolvedValue(updated);

    const result = await service.syncUser('clerk_abc', 'new@b.com');

    expect(create).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith({ ...existing, email: 'new@b.com' });
    expect(result.email).toEqual('new@b.com');
  });

  it('returns invitation data when pending invitation exists for user email', async () => {
    const { repo: userRepo, findOne, save } = makeRepo<User>();
    const { repo: invRepo } = makeRepo<Invitation>();
    const { repo: orgRepo } = makeRepo<Organization>();

    const newUser = {
      id: 'uuid-1',
      clerkId: 'clerk_abc',
      email: 'invited@b.com',
      role: null,
      orgId: null,
    } as unknown as User;

    findOne.mockResolvedValue(null);
    (userRepo.create as jest.Mock).mockReturnValue(newUser);
    save.mockResolvedValue(newUser);

    // Simulate: SET LOCAL row_security = off → [], then invitation rows, then org rows
    const query = jest
      .fn()
      .mockResolvedValueOnce([]) // SET LOCAL
      .mockResolvedValueOnce([{ id: 'inv-1', org_id: 'org-1', role: 'member' }])
      .mockResolvedValueOnce([
        { id: 'org-1', name: 'Acme Corp', slug: 'acme' },
      ]);

    const qr = {
      connect: jest.fn().mockResolvedValue(undefined),
      query,
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(qr),
    } as unknown as DataSource;

    const service = new AuthService(userRepo, invRepo, orgRepo, dataSource);
    const result = await service.syncUser('clerk_abc', 'invited@b.com');

    expect(result.invitation).toEqual({
      id: 'inv-1',
      orgName: 'Acme Corp',
      orgSlug: 'acme',
      role: 'member',
    });
  });
});
