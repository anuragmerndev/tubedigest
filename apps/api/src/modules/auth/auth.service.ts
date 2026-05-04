import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  User,
  Invitation,
  InvitationStatus,
  Organization,
} from '../../database/entities';

export interface SyncUserResult {
  id: string;
  clerkId: string;
  email: string;
  role: string | null;
  orgId: string | null;
  invitation: {
    id: string;
    orgName: string;
    orgSlug: string;
    role: string;
  } | null;
}

@Injectable()
export class AuthService {
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

  async syncUser(clerkId: string, email: string): Promise<SyncUserResult> {
    let user = await this.userRepo.findOne({ where: { clerkId } });

    if (user) {
      user.email = email;
      user = await this.userRepo.save(user);
    } else {
      user = this.userRepo.create({ clerkId, email });
      user = await this.userRepo.save(user);
    }

    // If user already has an org, no need to check invitations
    if (user.orgId) {
      return {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        invitation: null,
      };
    }

    // Check for pending invitation by email.
    // The invitations table has RLS (org_id = current_setting('app.org_id')::uuid).
    // Since this endpoint uses @SkipTenant(), no app.org_id is set in the session.
    // We use a query runner to temporarily disable row_security for this lookup.
    // If the DB role lacks BYPASSRLS, SET LOCAL row_security = off will throw —
    // in that case we fall back gracefully (no invitation data, user creates new org).
    let invitationData: SyncUserResult['invitation'] = null;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      await qr.startTransaction();
      await qr.query(`SET LOCAL row_security = off`);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const invRows: Array<{
        id: string;
        org_id: string;
        role: string;
      }> = await qr.query(
        `SELECT id, org_id, role
         FROM invitations
         WHERE email = $1
           AND status = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [email, InvitationStatus.PENDING],
      );

      if (invRows.length > 0) {
        const inv = invRows[0];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const orgRows: Array<{
          id: string;
          name: string;
          slug: string;
        }> = await qr.query(
          `SELECT id, name, slug FROM organizations WHERE id = $1 LIMIT 1`,
          [inv.org_id],
        );

        if (orgRows.length > 0) {
          const org = orgRows[0];
          invitationData = {
            id: inv.id,
            orgName: org.name,
            orgSlug: org.slug,
            role: inv.role,
          };
        }
      }

      await qr.commitTransaction();
    } catch {
      // If SET LOCAL row_security = off fails (insufficient DB privileges),
      // invitation lookup is skipped — user proceeds through normal org creation.
      await qr.rollbackTransaction();
      invitationData = null;
    } finally {
      await qr.release();
    }

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      invitation: invitationData,
    };
  }

  async deleteUser(clerkId: string): Promise<void> {
    await this.userRepo.delete({ clerkId });
  }
}
