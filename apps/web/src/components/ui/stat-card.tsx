import { Card } from './card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'success' | 'muted'
  pct?: number
  className?: string
}

export function StatCard({ label, value, sub, tone = 'default', pct, className }: StatCardProps) {
  const subColor =
    tone === 'success'
      ? 'text-td-success'
      : tone === 'muted'
        ? 'text-td-text-dim'
        : 'text-td-text-muted'

  return (
    <Card padding={18} className={className}>
      <div className="font-mono-td text-[11.5px] text-td-text-muted uppercase tracking-[0.04em] mb-2.5">
        {label}
      </div>
      <div className="text-[30px] font-semibold tracking-[-0.025em] leading-none">{value}</div>
      {sub && <div className={cn('text-[11.5px] mt-1.5', subColor)}>{sub}</div>}
      {pct != null && (
        <div className="mt-2.5 h-1 bg-td-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </Card>
  )
}
