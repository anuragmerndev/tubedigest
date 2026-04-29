'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sparkles,
  LayoutDashboard,
  History,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

interface SidebarProps {
  orgName?: string
  orgPlan?: string
  usageCount?: number
  usageLimit?: number
}

const NAV = [
  { id: 'summarize', label: 'Summarize', href: '/summarize', icon: Sparkles },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'history', label: 'History', href: '/history', icon: History },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({
  orgName = 'My Workspace',
  orgPlan = 'Free',
  usageCount = 0,
  usageLimit = 10,
}: SidebarProps) {
  const pathname = usePathname()
  const active = NAV.find((n) => pathname.startsWith(n.href))?.id

  const usagePct = usageLimit > 0 ? Math.min((usageCount / usageLimit) * 100, 100) : 0
  const orgInitials = orgName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-background flex flex-col px-2.5 py-3.5">
      {/* Logo */}
      <div className="px-2 pb-3.5">
        <Logo size={20} />
      </div>

      {/* Org switcher */}
      <div className="mx-0.5 mb-3 px-2.5 py-2 rounded-lg border border-border bg-card flex items-center gap-2 cursor-pointer hover:border-td-border-strong transition-colors">
        <div
          className="grid place-items-center text-white text-[11px] font-semibold rounded-[5px] shrink-0"
          style={{
            width: 22,
            height: 22,
            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
          }}
        >
          {orgInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-foreground truncate">{orgName}</div>
          <div className="text-[10.5px] text-td-text-dim capitalize">{orgPlan} plan</div>
        </div>
        <ChevronDown size={13} className="text-td-text-dim shrink-0" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const on = item.id === active
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[13px] transition-colors',
                on
                  ? 'bg-card border border-border text-foreground font-medium'
                  : 'border border-transparent text-td-text-muted hover:text-foreground hover:bg-accent',
              )}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Usage meter */}
      <div className="mt-auto pt-3 px-0.5">
        <div className="p-3 rounded-[9px] border border-border bg-card">
          <div className="text-[12px] font-medium mb-1">Usage this month</div>
          <div className="text-[11px] text-td-text-muted mb-2">
            <span className="font-mono-td">{usageCount}</span>
            {' '}of{' '}
            <span className="font-mono-td">{usageLimit}</span>
          </div>
          <div className="h-1 rounded-full bg-td-surface2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
