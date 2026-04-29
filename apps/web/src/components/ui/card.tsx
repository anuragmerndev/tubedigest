import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: number | string
}

export function Card({ children, className, padding = 20 }: CardProps) {
  return (
    <div
      className={cn('bg-card border border-border rounded-xl', className)}
      style={{ padding }}
    >
      {children}
    </div>
  )
}
