import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, iconRight, className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-0 bottom-0 flex items-center text-td-text-dim pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-9 bg-card border border-border rounded-lg text-foreground',
            'text-[13.5px] tracking-[-0.005em] font-[family-name:var(--font-geist-sans)]',
            'placeholder:text-td-text-dim',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50',
            'transition-colors',
            icon ? 'pl-9' : 'pl-3',
            iconRight ? 'pr-9' : 'pr-3',
            className,
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-0 bottom-0 flex items-center text-td-text-dim pointer-events-none">
            {iconRight}
          </div>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
