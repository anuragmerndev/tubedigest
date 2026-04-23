import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'youtube_video_id', unique: true })
  youtubeVideoId: string;

  @Column()
  url: string;

  @Column({ type: 'text', nullable: true })
  transcript: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
