interface DayData {
  date: string
  count: number
  cached?: number
}

interface UsageChartProps {
  data: DayData[]
  height?: number
  className?: string
}

export function UsageChart({ data, height = 160, className }: UsageChartProps) {
  if (!data.length) return null

  const max = Math.max(...data.map((d) => d.count))
  const safeMax = max || 1

  return (
    <div className={className}>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => {
          const cached = d.cached ?? 0
          const fresh = d.count - cached
          const totalH = (d.count / safeMax) * height
          const cachedH = d.count > 0 ? (cached / d.count) * totalH : 0
          const freshH = totalH - cachedH

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end"
              style={{ height: '100%' }}
              title={`${d.date}: ${d.count} summaries`}
            >
              {cachedH > 0 && (
                <div
                  className="rounded-b-[2px]"
                  style={{ height: cachedH, background: 'var(--td-border-strong)' }}
                />
              )}
              {freshH > 0 && (
                <div
                  className="rounded-t-[2px] bg-primary"
                  style={{ height: freshH }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 font-mono-td text-[10.5px] text-td-text-dim">
        {data.length > 0 && (
          <>
            <span>{formatDate(data[0].date)}</span>
            {data.length > 4 && (
              <span>{formatDate(data[Math.floor(data.length / 4)].date)}</span>
            )}
            {data.length > 2 && (
              <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>
            )}
            {data.length > 3 && (
              <span>{formatDate(data[Math.floor((data.length * 3) / 4)].date)}</span>
            )}
            <span>{formatDate(data[data.length - 1].date)}</span>
          </>
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
