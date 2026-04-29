'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { UsageChart } from '@/components/ui/usage-chart'
import { VideoThumb } from '@/components/ui/video-thumb'
import { buttonVariants } from '@/components/ui/button'
import { useUsageCurrent, useUsageDaily, useSummaries } from '@/hooks/use-api'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: undefined,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function extractVideoId(url: string) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? url
  } catch {
    return url
  }
}

export default function DashboardPage() {
  const { user } = useUser()
  const { data: usage, loading: usageLoading } = useUsageCurrent()
  const { data: daily, loading: dailyLoading } = useUsageDaily()
  const { data: summaryList, loading: summariesLoading } = useSummaries(1, 5)

  const firstName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    'there'

  const count = usage?.count ?? 0
  const limit = usage?.limit ?? 500
  const pct = limit > 0 ? (count / limit) * 100 : 0
  const remaining = Math.max(0, limit - count)

  const chartData = (daily ?? []).map((d) => ({ date: d.date, count: d.count }))
  const totalInChart = chartData.reduce((s, d) => s + d.count, 0)

  const recentSummaries = summaryList?.data ?? []

  return (
    <div className="p-6 pb-10" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[24px] font-semibold tracking-[-0.02em]">
            {getGreeting()}, {firstName}.
          </div>
          <div className="text-[13px] text-td-text-muted mt-0.5">
            {todayLabel()}
          </div>
        </div>
        <Link
          href="/summarize"
          className={buttonVariants({ size: 'sm' })}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1.5">
            <path d="M6 1.5C5.5 1.5 5 2 4.5 2.5C3.5 3.5 2 5 2 7C2 8.7 3.3 10 5 10C5.8 10 6.5 9.7 7 9.2C7.5 8.7 8 7.9 8 7C8 5.8 7.2 4.8 6.5 4C5.8 3.2 5 2.3 5 1.5H6Z" fill="currentColor" opacity="0.6"/>
            <path d="M2 6.5C2.5 5.5 3.5 4.5 4.5 4C5 3.8 5.5 3.7 6 3.5C6.5 3.3 7 3 7.5 2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            <circle cx="6" cy="7" r="2" fill="currentColor"/>
          </svg>
          New summary
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3.5 mb-3.5">
        <StatCard
          label="Summaries used"
          value={usageLoading ? '—' : String(count)}
          sub={usageLoading ? 'Loading…' : `of ${limit} this month`}
          pct={usageLoading ? undefined : pct}
        />
        <StatCard
          label="Remaining"
          value={usageLoading ? '—' : String(remaining)}
          sub="summaries left this period"
          tone={remaining < limit * 0.15 ? 'muted' : 'default'}
        />
        <StatCard
          label="Plan"
          value={usageLoading ? '—' : (limit >= 500 ? 'Pro' : 'Free')}
          sub={usageLoading ? 'Loading…' : `${limit} summaries / month`}
        />
      </div>

      {/* Chart + Recent */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Chart card */}
        <Card padding={0}>
          <div
            className="px-5 py-[18px] border-b border-border flex justify-between items-center"
          >
            <div>
              <div className="text-[13.5px] font-medium">Daily usage</div>
              <div className="text-[11.5px] text-td-text-muted mt-0.5">
                Last 30 days ·{' '}
                <span className="font-mono-td">
                  {dailyLoading ? '…' : `${totalInChart} summaries`}
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 text-[11px] text-td-text-muted">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full bg-primary"
                />
                New
              </div>
            </div>
          </div>
          <div className="p-[18px]">
            {dailyLoading ? (
              <div className="h-40 flex items-center justify-center text-[12px] text-td-text-dim">
                Loading chart…
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-[12px] text-td-text-dim">
                No data yet
              </div>
            ) : (
              <UsageChart data={chartData} height={160} />
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card padding={0}>
          <div className="px-5 py-[18px] border-b border-border flex justify-between items-center">
            <div className="text-[13.5px] font-medium">Recent activity</div>
            <Link
              href="/history"
              className="text-[12px] text-td-text-muted hover:text-td-text transition-colors"
            >
              View all →
            </Link>
          </div>
          <div>
            {summariesLoading ? (
              <div className="px-5 py-6 text-[12px] text-td-text-dim">Loading…</div>
            ) : recentSummaries.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <div className="text-[13px] text-td-text-muted mb-1">No summaries yet</div>
                <Link
                  href="/summarize"
                  className="text-[12px] text-primary hover:underline"
                >
                  Summarize your first video →
                </Link>
              </div>
            ) : (
              recentSummaries.map((s, i) => {
                const isLast = i === recentSummaries.length - 1
                const videoUrl = s.video?.url ?? ''
                const videoId = extractVideoId(videoUrl)
                const seed = i % 5

                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-border' : ''}`}
                  >
                    <VideoThumb
                      seed={seed}
                      className="w-14 shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium truncate text-td-text">
                        {videoId}
                      </div>
                      <div className="text-[11px] text-td-text-dim mt-0.5">
                        {timeAgo(s.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
