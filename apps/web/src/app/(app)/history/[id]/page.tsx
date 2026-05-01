'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VideoThumb } from '@/components/ui/video-thumb'
import { useSummary } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

function extractVideoId(url: string) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? url
  } catch {
    return url
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function SummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: summary, loading, error } = useSummary(id)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!summary?.video?.summary) return
    navigator.clipboard.writeText(summary.video.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6" style={{ maxWidth: 1180 }}>
        <div className="flex items-center gap-2 text-td-text-muted text-[13px]">
          <div className="size-4 border-2 border-td-text-dim border-t-primary rounded-full animate-spin" />
          Loading summary…
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-6" style={{ maxWidth: 1180 }}>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-[13px] text-td-text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft size={13} />
          Back to history
        </Link>
        <Card padding={14}>
          <div className="text-[13px] text-td-text-muted">
            Summary not found or unavailable.
          </div>
        </Card>
      </div>
    )
  }

  const video = summary.video
  const videoUrl = video?.url ?? ''
  const videoId = extractVideoId(videoUrl)
  const summaryText = video?.summary ?? ''
  const { date, time } = formatDate(summary.createdAt)
  const seed = videoId.charCodeAt(0) % 5

  return (
    <div className="p-6 pb-10" style={{ maxWidth: 1180 }}>
      {/* Back link */}
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-[13px] text-td-text-muted hover:text-foreground mb-5"
      >
        <ArrowLeft size={13} />
        Back to history
      </Link>

      {/* Header */}
      <div className="mb-5">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">Summary detail</div>
        <div className="text-[13px] text-td-text-muted mt-0.5">
          {date} at {time}
        </div>
      </div>

      {/* Result card */}
      <Card padding={0}>
        {/* Header bar */}
        <div className="flex justify-between items-center px-[22px] py-3.5 border-b border-border">
          <div className="text-[12.5px] font-medium text-td-text-muted">
            Summary
          </div>
          <div className="flex gap-1.5">
            {summaryText && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
            {videoUrl && (
              <Link
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              >
                <ExternalLink size={11} />
                Open
              </Link>
            )}
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
              <Badge tone="neutral">
                {date}
              </Badge>
            </div>
            {videoUrl && (
              <div className="mt-3.5">
                <Link
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-full')}
                >
                  <ExternalLink size={11} />
                  Open on YouTube
                </Link>
              </div>
            )}
          </div>

          {/* Right: summary */}
          <div>
            {summaryText ? (
              <div
                className="p-3.5 rounded-[9px]"
                style={{
                  background: 'var(--td-primary-dim)',
                  border: '1px solid var(--td-primary-border)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={12} className="text-primary" />
                  <span className="font-mono-td text-[10.5px] text-primary tracking-[0.06em]">
                    SUMMARY
                  </span>
                </div>
                <div className="text-[13.5px] leading-relaxed text-td-text whitespace-pre-line">
                  {summaryText}
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-td-text-muted">
                Summary text is unavailable for this entry.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
