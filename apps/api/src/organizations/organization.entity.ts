import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
