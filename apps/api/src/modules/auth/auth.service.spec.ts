import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities';

function makeRepo() {
  const findOne = jest.fn();
  const save = jest.fn();
  const create = jest.fn();
  const repo = { findOne, save, create } as unknown as Repository<User>;
  return { repo, findOne, save, create };
}

describe('AuthService', () => {
  it('creates a new user when clerk_id not found', async () => {
    const { repo, findOne, create, save } = makeRepo();
    const service = new AuthService(repo);
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
    expect(result).toEqual(newUser);
  });

  it('updates email and returns existing user when clerk_id found', async () => {
    const { repo, findOne, create, save } = makeRepo();
    const service = new AuthService(repo);
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
    expect(result).toEqual(updated);
  });
});
