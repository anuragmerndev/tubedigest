import { cn } from '@/lib/utils'

interface VideoThumbProps {
  duration?: string
  seed?: number
  className?: string
}

const HUES: [number, number][] = [
  [262, 330],
  [220, 262],
  [200, 262],
  [280, 340],
  [260, 300],
]

export function VideoThumb({ duration, seed = 0, className }: VideoThumbProps) {
  const [h1, h2] = HUES[seed % HUES.length]

  return (
    <div
      className={cn('relative overflow-hidden rounded-lg border border-border w-full', className)}
      style={{
        aspectRatio: '16/9',
        background: `
          radial-gradient(ellipse at 20% 10%, hsl(${h1} 70% 50%) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 90%, hsl(${h2} 70% 45%) 0%, transparent 55%),
          linear-gradient(135deg, hsl(${h1} 40% 18%), hsl(${h2} 40% 12%))
        `,
      }}
    >
      {/* scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 3px)',
        }}
      />
      {/* play button */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="grid place-items-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 10 10">
            <path d="M2.5 1.5 L8 5 L2.5 8.5 Z" fill="#fff" />
          </svg>
        </div>
      </div>
      {/* duration chip */}
      {duration && (
        <div
          className="absolute right-2 bottom-2 font-mono-td text-white text-[11px] font-medium"
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.75)',
          }}
        >
          {duration}
        </div>
      )}
    </div>
  )
}
