import { Injectable, Logger } from '@nestjs/common';

interface TranscriptSegment {
  text: string;
  start: number;
  dur: number;
}

interface ApifyResultItem {
  data?: Array<{ start: string; dur: string; text: string }>;
}

export interface VideoDetails {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number;
}

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);
  private readonly apifyToken = process.env.APIFY_API_TOKEN;
  private readonly actorId = 'pintostudio~youtube-transcript-scraper';

  async fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
    // Primary: Apify scraper
    if (this.apifyToken) {
      try {
        const segments = await this.fetchViaApify(videoId);
        if (segments.length) return segments;
        this.logger.warn(
          `Apify returned 0 usable segments for ${videoId}, falling back to direct`,
        );
      } catch (err) {
        this.logger.warn(
          `Apify fetch failed for ${videoId}: ${(err as Error).message}. Falling back to direct.`,
        );
      }
    }

    // Fallback: direct scraping
    return this.fetchDirect(videoId);
  }

  private async fetchViaApify(videoId: string): Promise<TranscriptSegment[]> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const endpoint = `https://api.apify.com/v2/acts/${this.actorId}/run-sync-get-dataset-items?token=${this.apifyToken}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: url, targetLanguage: 'en' }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Apify HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const results = (await res.json()) as ApifyResultItem[];

    if (!Array.isArray(results) || !results.length || !results[0].data) {
      throw new Error('Apify returned no data');
    }

    const segments: TranscriptSegment[] = results[0].data
      .filter((item) => item.text && item.text.trim())
      .map((item) => ({
        text: item.text.trim(),
        start: parseFloat(item.start) || 0,
        dur: parseFloat(item.dur) || 0,
      }));

    this.logger.log(
      `Apify: fetched ${segments.length} transcript segments for ${videoId}`,
    );

    return segments;
  }

  private async fetchDirect(videoId: string): Promise<TranscriptSegment[]> {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!pageRes.ok) {
      throw new Error(`Failed to fetch YouTube page: ${pageRes.status}`);
    }

    const cookies = pageRes.headers.getSetCookie?.() ?? [];
    const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
    const html = await pageRes.text();

    const captionTracksMatch = html.match(
      /"captionTracks"\s*:\s*(\[.*?\])\s*,\s*"/,
    );
    if (!captionTracksMatch) {
      throw new Error('No caption tracks found for this video');
    }

    let captionTracks: Array<{ baseUrl: string; languageCode: string }>;
    try {
      captionTracks = JSON.parse(captionTracksMatch[1]) as Array<{
        baseUrl: string;
        languageCode: string;
      }>;
    } catch {
      throw new Error('Failed to parse caption tracks');
    }

    if (!captionTracks.length) {
      throw new Error('No caption tracks available');
    }

    const track =
      captionTracks.find((t) => t.languageCode === 'en') ?? captionTracks[0];

    const transcriptRes = await fetch(track.baseUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!transcriptRes.ok) {
      throw new Error(
        `Failed to fetch transcript XML: ${transcriptRes.status}`,
      );
    }

    const xml = await transcriptRes.text();

    if (!xml.trim()) {
      throw new Error('Transcript response was empty');
    }

    const segments: TranscriptSegment[] = [];
    const regex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(xml)) !== null) {
      segments.push({
        start: parseFloat(match[1]),
        dur: parseFloat(match[2]),
        text: this.decodeHtmlEntities(match[3]),
      });
    }

    if (!segments.length) {
      const altRegex = /<text[^>]*>([^<]+)<\/text>/g;
      let altMatch: RegExpExecArray | null;
      while ((altMatch = altRegex.exec(xml)) !== null) {
        segments.push({
          start: 0,
          dur: 0,
          text: this.decodeHtmlEntities(altMatch[1]),
        });
      }
    }

    this.logger.log(
      `Direct: fetched ${segments.length} transcript segments for ${videoId}`,
    );

    return segments;
  }

  async fetchVideoDetails(videoId: string): Promise<VideoDetails | null> {
    if (!this.apifyToken) return null;

    const detailsActorId = 'thenetaji~youtube-video-details-scraper';
    const endpoint = `https://api.apify.com/v2/acts/${detailsActorId}/run-sync-get-dataset-items?token=${this.apifyToken}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'video_details', videoIds: [videoId] }),
      });

      if (!res.ok) {
        this.logger.warn(
          `Apify video details HTTP ${res.status} for ${videoId}`,
        );
        return null;
      }

      const results = (await res.json()) as Array<{
        title?: string;
        channelTitle?: string;
        thumbnail?: Array<{ url: string; width: number; height: number }>;
        lengthSeconds?: string;
      }>;

      if (!Array.isArray(results) || !results.length) return null;

      const item = results[0];
      const thumbnails = item.thumbnail ?? [];
      const bestThumb =
        thumbnails.sort((a, b) => b.width - a.width)[0]?.url ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        title: item.title ?? '',
        channelName: item.channelTitle ?? '',
        thumbnailUrl: bestThumb,
        duration: parseInt(item.lengthSeconds ?? '0', 10) || 0,
      };
    } catch (err) {
      this.logger.warn(
        `Video details fetch failed for ${videoId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num: string) =>
        String.fromCharCode(parseInt(num, 10)),
      )
      .replace(/\n/g, ' ');
  }
}
