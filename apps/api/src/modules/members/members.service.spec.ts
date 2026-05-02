import { MembersService } from './members.service';
import { Repository } from 'typeorm';
import {
  User,
  UserRole,
  Invitation,
  InvitationStatus,
} from '../../database/entities';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

function makeUserRepo() {
  const find = jest.fn();
  const findOne = jest.fn();
  const save = jest.fn();
  const repo = { find, findOne, save } as unknown as Repository<User>;
  return { repo, find, findOne, save };
}

function makeInvitationRepo() {
  const find = jest.fn();
  const findOne = jest.fn();
  const create = jest.fn();
  const save = jest.fn();
  const repo = {
    find,
    findOne,
    create,
    save,
  } as unknown as Repository<Invitation>;
  return { repo, find, findOne, create, save };
}

const owner = {
  id: 'u1',
  clerkId: 'clerk_owner',
  orgId: 'org1',
  role: UserRole.OWNER,
} as User;
const member = {
  id: 'u2',
  clerkId: 'clerk_member',
  orgId: 'org1',
  role: UserRole.MEMBER,
} as User;

describe('MembersService', () => {
  describe('listMembers', () => {
    it('returns all users in the org', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      userRepo.findOne.mockResolvedValue(owner);
      userRepo.find.mockResolvedValue([owner, member]);

      const service = new MembersService(userRepo.repo, invRepo.repo);
      const result = await service.listMembers('clerk_owner');

      expect(userRepo.find).toHaveBeenCalledWith({ where: { orgId: 'org1' } });
      expect(result).toHaveLength(2);
    });

    it('throws NotFoundException when user has no org', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      userRepo.findOne.mockResolvedValue({ id: 'u1', orgId: null });

      const service = new MembersService(userRepo.repo, invRepo.repo);
      await expect(service.listMembers('clerk_owner')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeMember', () => {
    it('prevents removing self', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      userRepo.findOne.mockResolvedValue(owner);

      const service = new MembersService(userRepo.repo, invRepo.repo);
      await expect(service.removeMember('clerk_owner', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('removes a member by setting orgId to null', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      userRepo.findOne
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(member);
      userRepo.save.mockResolvedValue({ ...member, orgId: null });

      const service = new MembersService(userRepo.repo, invRepo.repo);
      await service.removeMember('clerk_owner', 'u2');

      expect(userRepo.save).toHaveBeenCalledWith({ ...member, orgId: null });
    });
  });

  describe('invitations', () => {
    it('creates a pending invitation', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      const inv = {
        id: 'inv1',
        orgId: 'org1',
        email: 'new@b.com',
        status: InvitationStatus.PENDING,
      };

      userRepo.findOne.mockResolvedValue(owner);
      invRepo.create.mockReturnValue(inv);
      invRepo.save.mockResolvedValue(inv);

      const service = new MembersService(userRepo.repo, invRepo.repo);
      const result = await service.inviteMember(
        'clerk_owner',
        'new@b.com',
        UserRole.MEMBER,
      );

      expect(invRepo.create).toHaveBeenCalledWith({
        orgId: 'org1',
        email: 'new@b.com',
        role: UserRole.MEMBER,
        invitedBy: 'u1',
      });
      expect(result).toEqual(inv);
    });

    it('lists pending invitations for the org', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      const inv = {
        id: 'inv1',
        orgId: 'org1',
        status: InvitationStatus.PENDING,
      };

      userRepo.findOne.mockResolvedValue(owner);
      invRepo.find.mockResolvedValue([inv]);

      const service = new MembersService(userRepo.repo, invRepo.repo);
      const result = await service.listInvitations('clerk_owner');

      expect(invRepo.find).toHaveBeenCalledWith({
        where: { orgId: 'org1', status: InvitationStatus.PENDING },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('cancels an invitation', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      const inv = {
        id: 'inv1',
        orgId: 'org1',
        status: InvitationStatus.PENDING,
      } as Invitation;

      userRepo.findOne.mockResolvedValue(owner);
      invRepo.findOne.mockResolvedValue(inv);
      invRepo.save.mockResolvedValue({
        ...inv,
        status: InvitationStatus.CANCELLED,
      });

      const service = new MembersService(userRepo.repo, invRepo.repo);
      await service.cancelInvitation('clerk_owner', 'inv1');

      expect(invRepo.save).toHaveBeenCalledWith({
        ...inv,
        status: InvitationStatus.CANCELLED,
      });
    });

    it('throws NotFoundException when invitation not found', async () => {
      const userRepo = makeUserRepo();
      const invRepo = makeInvitationRepo();
      userRepo.findOne.mockResolvedValue(owner);
      invRepo.findOne.mockResolvedValue(null);

      const service = new MembersService(userRepo.repo, invRepo.repo);
      await expect(
        service.cancelInvitation('clerk_owner', 'inv-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
