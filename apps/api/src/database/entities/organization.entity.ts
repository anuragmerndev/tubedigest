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

  @Column({ name: 'credit_balance', type: 'int', default: 10 })
  creditBalance: number;

  @Column({ name: 'credit_limit', type: 'int', default: 10 })
  creditLimit: number;

  @Column({
    name: 'credit_reset_period',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  creditResetPeriod: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
