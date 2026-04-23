import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clerk_id', unique: true })
  clerkId: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
