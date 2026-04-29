import { ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

interface TopbarProps {
  crumbs: string[]
  actions?: React.ReactNode
  userName?: string
}

export function Topbar({ crumbs, actions, userName = 'User' }: TopbarProps) {
  return (
    <header className="h-[52px] border-b border-border shrink-0 flex items-center px-5 gap-3 bg-background">
      {/* Breadcrumbs */}
      <div className="flex-1 flex items-center gap-1.5 text-[13px] text-td-text-muted min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="text-td-text-dim shrink-0" />}
            <span
              className={
                i === crumbs.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-td-text-muted'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Divider + Avatar */}
      <div className="w-px h-5 bg-border" />
      <Avatar name={userName} size={26} />
    </header>
  )
}
