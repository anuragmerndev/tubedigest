import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string
  size?: number
  src?: string
  className?: string
}

const HUES = [262, 220, 190, 340, 30, 150]

export function Avatar({ name = '?', size = 28, src, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const hue = HUES[(name.charCodeAt(0) || 0) % HUES.length]

  return (
    <div
      className={cn('grid place-items-center shrink-0 text-white font-semibold border border-border rounded-full', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        letterSpacing: '-0.02em',
        background: src
          ? `url(${src}) center/cover`
          : `linear-gradient(135deg, hsl(${hue} 70% 60%), hsl(${hue} 60% 45%))`,
      }}
    >
      {!src && initials}
    </div>
  )
}
