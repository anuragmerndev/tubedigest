'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { VideoThumb } from '@/components/ui/video-thumb'
import { useSubmitSummary, useOrg } from '@/hooks/use-api'
import type { SummaryResult } from '@/lib/api'
import { cn } from '@/lib/utils'

function extractVideoId(url: string) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? url
  } catch {
    return url
  }
}

function timeAgo(ms: number) {
  if (ms < 1000) return 'just now'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

function IconLink({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M5.5 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8.5M8.5 2H12m0 0v3.5M12 2 6.5 7.5"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSparkle({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5 7.8 5H11L8.1 7.4 9.1 11 6.5 9 3.9 11 4.9 7.4 2 5H5.2Z" fill="currentColor" opacity="0.9"/>
    </svg>
  )
}

function IconClock({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M5.5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function IconShield({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1 2 2.5v3.5C2 8 3.5 9.5 5.5 10 7.5 9.5 9 8 9 6V2.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCopy({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M2.5 7.5H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1v.5" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  )
}

function IconExtern({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5M6.5 1H10m0 0v3.5M10 1 5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SummarizePage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [copied, setCopied] = useState(false)
  const submitTimeRef = useRef<number>(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  const { submit, loading, error } = useSubmitSummary()
  const { data: org } = useOrg()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || loading) return
    setResult(null)
    submitTimeRef.current = Date.now()
    const res = await submit(url.trim())
    setElapsedMs(Date.now() - submitTimeRef.current)
    setResult(res)
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const videoId = result ? extractVideoId(result.url) : ''
  const seed = result ? (result.videoId.charCodeAt(0) % 5) : 0

  return (
    <div className="p-6 pb-10" style={{ maxWidth: 1180 }}>
      {/* Header */}
      <div className="mb-5">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">Summarize a video</div>
        <div className="text-[13px] text-td-text-muted mt-0.5">
          Paste any YouTube URL. We pull the transcript and summarize it with AI.
        </div>
      </div>

      {/* Input card */}
      <Card padding={14} className="mb-5">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                size={undefined}
                className="h-10 text-[14px]"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                icon={<IconLink size={14} />}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading || !url.trim()}
              className="shrink-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-0.5 mr-1.5 size-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Summarizing…
                </>
              ) : (
                <>
                  Summarize
                  <IconSparkle size={13} />
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-between items-center mt-2.5 text-[11.5px] text-td-text-dim">
            <div className="flex gap-3.5">
              <span className="flex items-center gap-1.5">
                <IconClock size={11} />
                Typically 4–8 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <IconShield size={11} />
                Private to {org?.name ?? 'your workspace'}
              </span>
            </div>
            <div>
              Source:{' '}
              <span className="font-mono-td text-td-text-muted">youtube-transcript</span>
            </div>
          </div>
        </form>
      </Card>

      {/* Error state */}
      {error && !loading && (
        <Card padding={14} className="mb-5 border-[rgba(239,68,68,0.3)]">
          <div className="flex items-start gap-3">
            <div className="text-destructive mt-0.5">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7.5 4.5v3M7.5 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-destructive">Failed to summarize</div>
              <div className="text-[12px] text-td-text-muted mt-0.5">{error.message}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Result card */}
      {result && (
        <Card padding={0}>
          {/* Result header bar */}
          <div className="flex justify-between items-center px-[22px] py-3.5 border-b border-border">
            <div className="text-[12.5px] font-medium text-td-text-muted">
              Summary ·{' '}
              <span className="text-td-text">{timeAgo(elapsedMs)}</span>
            </div>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <IconCopy size={11} />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Link
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              >
                <IconExtern size={11} />
                Open
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="p-6" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28 }}>
            {/* Left: video card */}
            <div>
              <VideoThumb seed={seed} />
              <div className="text-[13.5px] font-medium mt-3 leading-snug tracking-[-0.01em] break-all">
                {videoId}
              </div>
              <div className="text-[11.5px] text-td-text-muted mt-1.5">
                youtube.com
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                <Badge tone="success">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M5 1 6.2 4H9L6.6 5.8 7.5 9 5 7.2 2.5 9l.9-3.2L1 4h2.8Z"/>
                  </svg>
                  {(elapsedMs / 1000).toFixed(1)}s
                </Badge>
                {result.truncated && (
                  <Badge tone="warn">Truncated · over token limit</Badge>
                )}
              </div>
              <div className="mt-3.5">
                <Link
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-full')}
                >
                  <IconExtern size={11} />
                  Open on YouTube
                </Link>
              </div>
            </div>

            {/* Right: summary */}
            <div>
              <div
                className="p-3.5 rounded-[9px] mb-5"
                style={{
                  background: 'var(--td-primary-dim)',
                  border: '1px solid var(--td-primary-border)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IconSparkle size={12} />
                  <span
                    className="font-mono-td text-[10.5px] text-primary tracking-[0.06em]"
                  >
                    SUMMARY
                  </span>
                </div>
                <div className="text-[13.5px] leading-relaxed text-td-text">
                  {result.summary}
                </div>
              </div>

              {result.truncated && (
                <div
                  className="flex items-center gap-2 text-[11.5px] text-td-text-muted p-2.5 rounded-lg"
                  style={{ background: 'var(--td-surface2)' }}
                >
                  <IconShield size={12} />
                  Transcript exceeded the token limit. Summary covers the full video; only a prefix was sent to the AI.
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-td text-[10.5px] text-td-text-dim uppercase tracking-[0.06em]">
                    Past summaries
                  </span>
                  <Link href="/history" className="text-[11.5px] text-td-text-muted hover:text-td-text transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="text-[12px] text-td-text-dim">
                  This summary has been saved to your{' '}
                  <Link href="/history" className="text-primary hover:underline">history</Link>.
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
