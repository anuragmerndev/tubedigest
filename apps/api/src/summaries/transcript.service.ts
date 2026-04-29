import { Injectable, Logger } from '@nestjs/common';

interface TranscriptSegment {
  text: string;
  start: number;
  dur: number;
}

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  /**
   * Fetch YouTube transcript by extracting caption tracks from the video page
   * and fetching the timedtext URL with the same cookies.
   */
  async fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
    // Step 1: Fetch the YouTube video page
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

    // Capture cookies from the response
    const cookies = pageRes.headers.getSetCookie?.() ?? [];
    const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');

    const html = await pageRes.text();

    // Step 2: Extract captionTracks from the page JSON
    const captionTracksMatch = html.match(
      /"captionTracks"\s*:\s*(\[.*?\])\s*,\s*"/,
    );
    if (!captionTracksMatch) {
      throw new Error('No caption tracks found for this video');
    }

    let captionTracks: Array<{ baseUrl: string; languageCode: string }>;
    try {
      captionTracks = JSON.parse(captionTracksMatch[1]) as Array<{ baseUrl: string; languageCode: string }>;
    } catch {
      throw new Error('Failed to parse caption tracks');
    }

    if (!captionTracks.length) {
      throw new Error('No caption tracks available');
    }

    // Prefer English, fall back to first track
    const track =
      captionTracks.find((t) => t.languageCode === 'en') ?? captionTracks[0];

    // Step 3: Fetch the transcript XML using the same cookies
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

    // Step 4: Parse XML
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
      // Try alternative XML format (fmt=json3 not needed, but handle <text> without dur)
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
      `Fetched ${segments.length} transcript segments for video ${videoId}`,
    );

    return segments;
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num: string) => String.fromCharCode(parseInt(num, 10)))
      .replace(/\n/g, ' ');
  }
}
