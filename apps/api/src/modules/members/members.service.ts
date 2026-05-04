import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { createClerkClient } from '@clerk/backend';
import {
  User,
  UserRole,
  Invitation,
  InvitationStatus,
  Organization,
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
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

  async acceptInvitation(
    clerkId: string,
    invitationId: string,
  ): Promise<{ orgId: string; orgName: string; orgSlug: string }> {
    // The users and invitations tables both have RLS.
    // This endpoint uses @SkipTenant() (no app.org_id set), so we must
    // bypass RLS via a query runner with SET LOCAL row_security = off.
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      await qr.startTransaction();
      await qr.query(`SET LOCAL row_security = off`);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const userRows: Array<{
        id: string;
        email: string;
        org_id: string | null;
      }> = await qr.query(
        `SELECT id, email, org_id FROM users WHERE clerk_id = $1 LIMIT 1`,
        [clerkId],
      );
      if (userRows.length === 0) throw new NotFoundException('User not found');
      const userRow = userRows[0];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const invRows: Array<{
        id: string;
        org_id: string;
        email: string;
        role: string;
        status: string;
      }> = await qr.query(
        `SELECT id, org_id, email, role, status FROM invitations WHERE id = $1 AND status = $2 LIMIT 1`,
        [invitationId, InvitationStatus.PENDING],
      );
      if (invRows.length === 0)
        throw new NotFoundException('Invitation not found or already used');
      const invRow = invRows[0];

      if (invRow.email !== userRow.email) {
        throw new ForbiddenException(
          'This invitation was sent to a different email address',
        );
      }

      await qr.query(`UPDATE users SET org_id = $1, role = $2 WHERE id = $3`, [
        invRow.org_id,
        invRow.role,
        userRow.id,
      ]);

      await qr.query(`UPDATE invitations SET status = $1 WHERE id = $2`, [
        InvitationStatus.ACCEPTED,
        invRow.id,
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const orgRows: Array<{ id: string; name: string; slug: string }> =
        await qr.query(
          `SELECT id, name, slug FROM organizations WHERE id = $1 LIMIT 1`,
          [invRow.org_id],
        );

      await qr.commitTransaction();

      const org = orgRows[0];
      return {
        orgId: invRow.org_id,
        orgName: org?.name ?? '',
        orgSlug: org?.slug ?? '',
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
