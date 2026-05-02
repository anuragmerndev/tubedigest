import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClerkClient } from '@clerk/backend';
import {
  User,
  UserRole,
  Invitation,
  InvitationStatus,
} from '../../database/entities';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

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
    const saved = await this.invitationRepo.save(invitation);

    // Send invitation email via Clerk
    try {
      await this.clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/sign-up`,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send Clerk invitation email to ${email}: ${(err as Error).message}`,
      );
    }

    return saved;
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
