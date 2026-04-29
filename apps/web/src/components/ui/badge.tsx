import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger'

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-td-surface2 text-td-text-muted border-border',
  primary: 'bg-td-primary-dim text-primary border-td-primary-border',
  success: 'bg-[rgba(16,185,129,0.12)] text-td-success border-[rgba(16,185,129,0.3)]',
  warn:    'bg-[rgba(245,158,11,0.12)] text-td-warn border-[rgba(245,158,11,0.3)]',
  danger:  'bg-[rgba(239,68,68,0.12)] text-destructive border-[rgba(239,68,68,0.3)]',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-5 px-[7px] text-[11.5px] font-medium border rounded-[5px]',
        'leading-none tracking-[-0.005em]',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
