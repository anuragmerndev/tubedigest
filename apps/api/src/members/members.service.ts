import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Invitation, InvitationStatus } from '../invitations/invitation.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
  ) {}

  private async resolveUser(clerkId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId)
      throw new NotFoundException('No organisation found for this user');
    return user;
  }

  async listMembers(clerkId: string): Promise<User[]> {
    const user = await this.resolveUser(clerkId);
    return this.userRepo.find({ where: { orgId: user.orgId! } });
  }

  async removeMember(clerkId: string, memberId: string): Promise<void> {
    const user = await this.resolveUser(clerkId);
    if (user.id === memberId) {
      throw new ForbiddenException(
        'Cannot remove yourself from the organisation',
      );
    }
    const target = await this.userRepo.findOne({
      where: { id: memberId, orgId: user.orgId! },
    });
    if (!target) throw new NotFoundException('Member not found');
    target.orgId = null;
    await this.userRepo.save(target);
  }

  async inviteMember(
    clerkId: string,
    email: string,
    role: UserRole,
  ): Promise<Invitation> {
    const user = await this.resolveUser(clerkId);
    const invitation = this.invitationRepo.create({
      orgId: user.orgId!,
      email,
      role,
      invitedBy: user.id,
    });
    return this.invitationRepo.save(invitation);
  }

  async listInvitations(clerkId: string): Promise<Invitation[]> {
    const user = await this.resolveUser(clerkId);
    return this.invitationRepo.find({
      where: { orgId: user.orgId!, status: InvitationStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelInvitation(clerkId: string, invitationId: string): Promise<void> {
    const user = await this.resolveUser(clerkId);
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, orgId: user.orgId! },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    invitation.status = InvitationStatus.CANCELLED;
    await this.invitationRepo.save(invitation);
  }
}
