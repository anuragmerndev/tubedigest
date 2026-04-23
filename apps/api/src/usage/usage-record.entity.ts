import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

const FREE_MONTHLY_LIMIT = 10;

@Entity('usage_records')
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @Column({ length: 7 })
  period: string; // "YYYY-MM"

  @Column({ type: 'int', default: 0 })
  count: number;

  @Column({ name: 'summary_limit', type: 'int', default: FREE_MONTHLY_LIMIT })
  limit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
