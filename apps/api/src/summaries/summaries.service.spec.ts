import { SummariesService } from './summaries.service';
import { Repository } from 'typeorm';
import { Video } from './video.entity';
import { UserSummary } from './user-summary.entity';
import { User } from '../users/user.entity';
import { UnprocessableEntityException } from '@nestjs/common';

const mockFetchTranscript = jest.fn();
const mockOpenAICreate = jest.fn();

/** Widens `any` to `unknown` so downstream `as` casts are not stripped by no-unnecessary-type-assertion */
function toUnknown(v: unknown): unknown {
  return v;
}

jest.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: (...a: unknown[]): unknown => mockFetchTranscript(...a),
  },
  YoutubeTranscriptDisabledError: class extends Error {},
  YoutubeTranscriptNotAvailableError: class extends Error {},
  YoutubeTranscriptVideoUnavailableError: class extends Error {},
}));

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...a: unknown[]): unknown => mockOpenAICreate(...a),
      },
    },
  })),
}));

function makeRepo<T extends object>() {
  const findOne = jest.fn();
  const find = jest.fn();
  const create = jest.fn();
  const save = jest.fn();
  const repo = { findOne, find, create, save } as unknown as Repository<T>;
  return { repo, findOne, find, create, save };
}

const user = { id: 'u1', clerkId: 'clerk_abc', orgId: 'org1' } as User;

describe('SummariesService', () => {
  beforeEach(() => {
    mockFetchTranscript.mockReset();
    mockOpenAICreate.mockReset();
  });

  it('throws 422 when YouTube URL is invalid', async () => {
    const videoRepo = makeRepo<Video>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    userRepo.findOne.mockResolvedValue(user);

    const service = new SummariesService(
      videoRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
    );
    await expect(
      service.submitSummary('clerk_abc', 'https://notyoutube.com/watch?v=abc'),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('returns cached summary when video already processed', async () => {
    const videoRepo = makeRepo<Video>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const existingVideo = {
      id: 'vid1',
      youtubeVideoId: 'abc123',
      summary: 'cached summary',
      transcript: 'text',
    } as Video;
    const userSummary = {
      id: 'us1',
      videoId: 'vid1',
      userId: 'u1',
      orgId: 'org1',
    } as UserSummary;

    userRepo.findOne.mockResolvedValue(user);
    videoRepo.findOne.mockResolvedValue(existingVideo);
    summaryRepo.create.mockReturnValue(userSummary);
    summaryRepo.save.mockResolvedValue(userSummary);

    const service = new SummariesService(
      videoRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
    );
    const result = await service.submitSummary(
      'clerk_abc',
      'https://youtube.com/watch?v=abc123',
    );

    expect(mockFetchTranscript).not.toHaveBeenCalled();
    expect(mockOpenAICreate).not.toHaveBeenCalled();
    expect(result.summary).toBe('cached summary');
    expect(result.truncated).toBe(false);
  });

  it('fetches transcript and summarises on cache miss', async () => {
    const videoRepo = makeRepo<Video>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();
    const newVideo = {
      id: 'vid1',
      youtubeVideoId: 'abc123',
      summary: null,
      transcript: null,
    } as Video;
    const savedVideo = {
      ...newVideo,
      transcript: 'full text',
      summary: 'AI summary',
    } as Video;
    const userSummary = {
      id: 'us1',
      videoId: 'vid1',
      userId: 'u1',
      orgId: 'org1',
    } as UserSummary;

    userRepo.findOne.mockResolvedValue(user);
    videoRepo.findOne.mockResolvedValue(null);
    videoRepo.create.mockReturnValue(newVideo);
    videoRepo.save.mockResolvedValue(savedVideo);
    summaryRepo.create.mockReturnValue(userSummary);
    summaryRepo.save.mockResolvedValue(userSummary);
    mockFetchTranscript.mockResolvedValue([{ text: 'full text' }]);
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: 'AI summary' } }],
    });

    const service = new SummariesService(
      videoRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
    );
    const result = await service.submitSummary(
      'clerk_abc',
      'https://youtube.com/watch?v=abc123',
    );

    expect(mockFetchTranscript).toHaveBeenCalledWith('abc123');
    expect(mockOpenAICreate).toHaveBeenCalled();
    expect(result.summary).toBe('AI summary');
  });

  it('throws 422 when captions are disabled', async () => {
    const videoRepo = makeRepo<Video>();
    const summaryRepo = makeRepo<UserSummary>();
    const userRepo = makeRepo<User>();

    userRepo.findOne.mockResolvedValue(user);
    videoRepo.findOne.mockResolvedValue(null);
    videoRepo.create.mockReturnValue({ id: 'vid1', youtubeVideoId: 'abc123' });
    videoRepo.save.mockResolvedValue({ id: 'vid1' });

    const { YoutubeTranscriptDisabledError } = toUnknown(
      jest.requireMock('youtube-transcript'),
    ) as { YoutubeTranscriptDisabledError: new (...args: unknown[]) => Error };
    mockFetchTranscript.mockRejectedValue(
      new YoutubeTranscriptDisabledError('abc123'),
    );

    const service = new SummariesService(
      videoRepo.repo,
      summaryRepo.repo,
      userRepo.repo,
    );
    await expect(
      service.submitSummary('clerk_abc', 'https://youtube.com/watch?v=abc123'),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});
