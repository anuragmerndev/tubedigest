'use client'

import { useState, useRef, useEffect } from 'react'
import { useClerk } from '@clerk/nextjs'
import { ChevronRight, LogOut, Zap } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useBillingCheckout } from '@/hooks/use-api'

interface TopbarProps {
  crumbs: string[]
  actions?: React.ReactNode
  userName?: string
  orgPlan?: string
}

export function Topbar({ crumbs, actions, userName = 'User', orgPlan }: TopbarProps) {
  const { signOut } = useClerk()
  const { checkout, loading: checkoutLoading } = useBillingCheckout()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

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

      {/* Upgrade button */}
      {orgPlan !== 'pro' && (
        <Button
          size="sm"
          disabled={checkoutLoading}
          onClick={async () => {
            try {
              const url = await checkout()
              window.open(url, '_blank', 'noopener,noreferrer')
            } catch { /* noop */ }
          }}
        >
          <Zap size={12} />
          Upgrade · $10/mo
        </Button>
      )}

      {/* Divider + Avatar dropdown */}
      <div className="w-px h-5 bg-border" />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Avatar name={userName} size={26} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-lg border border-border bg-card shadow-xl py-1"
          >
            <div className="px-3 py-2 border-b border-border">
              <div className="text-[12px] text-td-text-muted truncate">{userName}</div>
            </div>
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-td-text-muted hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
