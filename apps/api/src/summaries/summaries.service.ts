import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { Video } from './video.entity';
import { UserSummary } from './user-summary.entity';
import { User } from '../users/user.entity';
import { UsageService } from '../usage/usage.service';
import { DodoClientService } from '../billing/dodo-client.service';
import { Organization } from '../organizations/organization.entity';
import { TranscriptService } from './transcript.service';

const MAX_CHARS = 16000; // ~4000 tokens

export interface SummaryResult {
  summaryId: string;
  videoId: string;
  url: string;
  summary: string;
  truncated: boolean;
}

@Injectable()
export class SummariesService {
  private readonly logger = new Logger(SummariesService.name);
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(UserSummary)
    private readonly userSummaryRepo: Repository<UserSummary>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly usageService: UsageService,
    private readonly dodo: DodoClientService,
    private readonly transcriptService: TranscriptService,
  ) {}

  private extractVideoId(url: string): string {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace('www.', '');
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const id = parsed.searchParams.get('v');
        if (id) return id;
      }
      if (host === 'youtu.be') {
        const id = parsed.pathname.slice(1);
        if (id) return id;
      }
    } catch {
      // fall through
    }
    throw new UnprocessableEntityException('Invalid YouTube URL');
  }

  private truncate(text: string): { text: string; truncated: boolean } {
    if (text.length <= MAX_CHARS) return { text, truncated: false };
    return { text: text.slice(0, MAX_CHARS), truncated: true };
  }

  async submitSummary(clerkId: string, url: string): Promise<SummaryResult> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId)
      throw new NotFoundException('User or organisation not found');

    const videoId = this.extractVideoId(url);

    // Enforce monthly limit before doing any work
    await this.usageService.checkAndIncrement(user.orgId);

    // Cache hit
    const existing = await this.videoRepo.findOne({
      where: { youtubeVideoId: videoId },
    });
    if (existing?.summary) {
      const userSummary = this.userSummaryRepo.create({
        userId: user.id,
        orgId: user.orgId,
        videoId: existing.id,
      });
      const saved = await this.userSummaryRepo.save(userSummary);
      void this.ingestUsageEvent(user.orgId, saved.id);
      return {
        summaryId: saved.id,
        videoId: existing.id,
        url: existing.url,
        summary: existing.summary,
        truncated: false,
      };
    }

    // Cache miss — fetch transcript
    let transcriptText: string;
    let truncated = false;

    try {
      const segments = await this.transcriptService.fetchTranscript(videoId);
      if (!segments.length) {
        throw new Error('No transcript segments returned');
      }
      const full = segments.map((s) => s.text).join(' ');
      const result = this.truncate(full);
      transcriptText = result.text;
      truncated = result.truncated;
    } catch (err) {
      this.logger.warn(
        `Transcript fetch failed for ${videoId}: ${(err as Error).message}`,
      );
      throw new UnprocessableEntityException(
        'No captions available for this video',
      );
    }

    // Summarise
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarises YouTube video transcripts concisely in 3–5 bullet points.',
        },
        { role: 'user', content: transcriptText },
      ],
    });

    const summary = completion.choices[0]?.message?.content ?? '';

    // Persist video
    const video =
      existing ?? this.videoRepo.create({ youtubeVideoId: videoId, url });
    video.transcript = transcriptText;
    video.summary = summary;
    const savedVideo = await this.videoRepo.save(video);

    // Record user summary
    const userSummary = this.userSummaryRepo.create({
      userId: user.id,
      orgId: user.orgId,
      videoId: savedVideo.id,
    });
    const savedUserSummary = await this.userSummaryRepo.save(userSummary);
    void this.ingestUsageEvent(user.orgId, savedUserSummary.id);

    return {
      summaryId: savedUserSummary.id,
      videoId: savedVideo.id,
      url: savedVideo.url,
      summary,
      truncated,
    };
  }

  private async ingestUsageEvent(
    orgId: string,
    eventId: string,
  ): Promise<void> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org?.dodoCustomerId) return;
    try {
      await this.dodo.client.usageEvents.ingest({
        events: [
          {
            event_id: eventId,
            customer_id: org.dodoCustomerId,
            event_name: 'video.summarized',
          },
        ],
      });
    } catch {
      // Fire-and-forget — don't fail the user's request if Dodo ingestion fails
    }
  }

  async listSummaries(
    clerkId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: UserSummary[]; total: number }> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const [data, total] = await this.userSummaryRepo.findAndCount({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async getSummary(clerkId: string, id: string): Promise<UserSummary> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const summary = await this.userSummaryRepo.findOne({
      where: { id, userId: user.id },
    });
    if (!summary) throw new NotFoundException('Summary not found');
    return summary;
  }
}
