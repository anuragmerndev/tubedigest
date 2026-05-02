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

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'channel_name', type: 'text', nullable: true })
  channelName: string | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
