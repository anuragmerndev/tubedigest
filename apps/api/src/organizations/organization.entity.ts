import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OrgPlan {
  FREE = 'free',
  PRO = 'pro',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: OrgPlan, default: OrgPlan.FREE })
  plan: OrgPlan;

  @Column({ name: 'dodo_customer_id', nullable: true, type: 'varchar' })
  dodoCustomerId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
