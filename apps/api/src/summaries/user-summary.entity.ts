import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('user_summaries')
export class UserSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @Column({ name: 'video_id', type: 'uuid' })
  videoId: string;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video?: Video;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
