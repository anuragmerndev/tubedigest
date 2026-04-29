import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  withWordmark?: boolean
  className?: string
}

export function Logo({ size = 22, withWordmark = true, className }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset, 0 4px 12px rgba(124,58,237,0.35)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 10 10">
          <path d="M2.2 1.5 L8.2 5 L2.2 8.5 Z" fill="#fff" />
        </svg>
      </div>
      {withWordmark && (
        <span
          style={{ fontSize: size * 0.82, fontWeight: 600, letterSpacing: '-0.02em' }}
          className="text-foreground"
        >
          TubeDigest
        </span>
      )}
    </div>
  )
}
