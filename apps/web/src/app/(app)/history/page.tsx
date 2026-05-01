'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { VideoThumb } from '@/components/ui/video-thumb'
import { Badge } from '@/components/ui/badge'
import { useSummaries } from '@/hooks/use-api'
import type { UserSummary } from '@/lib/api'
import { cn } from '@/lib/utils'

const PAGE_LIMIT = 10

function extractVideoId(url: string) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? url
  } catch {
    return url
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function IconSearch({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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

function IconSparkle({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5 7.8 5H11L8.1 7.4 9.1 11 6.5 9 3.9 11 4.9 7.4 2 5H5.2Z" fill="currentColor" opacity="0.9"/>
    </svg>
  )
}

function HistoryRow({ summary, last, index }: { summary: UserSummary; last: boolean; index: number }) {
  const videoUrl = summary.video?.url ?? ''
  const videoId = extractVideoId(videoUrl)
  const summaryText = summary.video?.summary ?? ''
  const tldr = summaryText.length > 120 ? summaryText.slice(0, 120) + '…' : summaryText
  const { date, time } = formatDate(summary.createdAt)
  const seed = index % 5

  return (
    <div
      className={cn(
        'grid items-center gap-3.5 px-[18px] py-3.5',
        !last && 'border-b border-border',
      )}
      style={{ gridTemplateColumns: '1fr 160px 80px' }}
    >
      {/* Video col */}
      <div className="flex gap-3 items-center min-w-0">
        <VideoThumb seed={seed} className="w-[84px] shrink-0 rounded-md" />
        <div className="min-w-0">
          <div className="text-[13px] font-medium truncate text-td-text">
            {videoId}
          </div>
          {tldr && (
            <div className="text-[11.5px] text-td-text-muted mt-1 line-clamp-2 leading-snug">
              {tldr}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[11px] text-td-text-dim font-mono-td">
              youtube.com
            </span>
          </div>
        </div>
      </div>

      {/* Date col */}
      <div>
        <div className="text-[12.5px] text-td-text">{date}</div>
        <div className="text-[11px] text-td-text-dim mt-0.5">{time}</div>
      </div>

      {/* Actions col */}
      <div className="flex justify-end gap-1.5">
        <Link
          href={`/history/${summary.id}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          View
        </Link>
        {videoUrl && (
          <Link
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            <IconExtern size={11} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, loading } = useSummaries(page, PAGE_LIMIT)

  const summaries = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  const filtered = search.trim()
    ? summaries.filter((s) => {
        const q = search.toLowerCase()
        const url = (s.video?.url ?? '').toLowerCase()
        const sum = (s.video?.summary ?? '').toLowerCase()
        return url.includes(q) || sum.includes(q)
      })
    : summaries

  const start = (page - 1) * PAGE_LIMIT + 1
  const end = Math.min(page * PAGE_LIMIT, total)

  function goTo(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
    setSearch('')
  }

  const pageNums = buildPageNums(page, totalPages)

  return (
    <div className="p-6 pb-10" style={{ maxWidth: 1180 }}>
      {/* Header */}
      <div className="mb-4 flex justify-between items-end">
        <div>
          <div className="text-[22px] font-semibold tracking-[-0.02em]">Summary history</div>
          <div className="text-[13px] text-td-text-muted mt-0.5">
            {loading ? 'Loading…' : `${total} summaries total`}
          </div>
        </div>
        <Link href="/summarize" className={buttonVariants({ size: 'sm' })}>
          <IconSparkle size={12} />
          New summary
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 items-center mb-3.5">
        <div className="flex-1" style={{ maxWidth: 440 }}>
          <Input
            placeholder="Search summaries…"
            icon={<IconSearch size={13} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table card */}
      <Card padding={0}>
        {/* Table header */}
        <div
          className="grid px-[18px] py-2.5 font-mono-td text-[11px] text-td-text-muted uppercase tracking-[0.05em] border-b border-border"
          style={{
            gridTemplateColumns: '1fr 160px 80px',
            background: 'var(--td-bg-elev)',
          }}
        >
          <div>Video</div>
          <div>Date</div>
          <div className="text-right">Open</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-[18px] py-8 text-center text-[13px] text-td-text-dim">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-[18px] py-12 text-center">
            {search ? (
              <>
                <div className="text-[13px] text-td-text-muted">No results for &ldquo;{search}&rdquo;</div>
                <button
                  className="text-[12px] text-primary mt-2 hover:underline"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="text-[13px] text-td-text-muted mb-1">No summaries yet</div>
                <Link href="/summarize" className="text-[12px] text-primary hover:underline">
                  Summarize your first video →
                </Link>
              </>
            )}
          </div>
        ) : (
          filtered.map((s, i) => (
            <HistoryRow
              key={s.id}
              summary={s}
              last={i === filtered.length - 1}
              index={i}
            />
          ))
        )}
      </Card>

      {/* Pagination */}
      {!loading && total > PAGE_LIMIT && (
        <div className="flex justify-between items-center mt-3.5 text-[12.5px] text-td-text-muted">
          <div>
            Showing{' '}
            <span className="font-mono-td text-td-text">{start}–{end}</span>
            {' '}of{' '}
            <span className="font-mono-td text-td-text">{total}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => goTo(page - 1)}
            >
              ← Previous
            </Button>
            {pageNums.map((n, i) =>
              n === '…' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1.5 self-center text-td-text-dim"
                >
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => goTo(Number(n))}
                  className={cn(
                    'min-w-7 h-7 px-2 rounded-md text-[12.5px] font-mono-td border transition-colors',
                    Number(n) === page
                      ? 'bg-td-surface border-border text-td-text font-medium'
                      : 'border-transparent text-td-text-muted hover:text-td-text',
                  )}
                >
                  {n}
                </button>
              ),
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => goTo(page + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = []
  pages.push(1)
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}
