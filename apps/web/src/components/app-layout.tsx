'use client'

import { usePathname } from 'next/navigation'
import { Shell } from '@/components/layout/shell'

interface AppLayoutProps {
  orgName?: string
  orgPlan?: string
  usageCount?: number
  usageLimit?: number
  userName?: string
  children: React.ReactNode
}

const ROUTE_CRUMBS: Record<string, string[]> = {
  '/dashboard': ['Dashboard'],
  '/summarize': ['Summarize'],
  '/history': ['History'],
  '/settings': ['Settings'],
  '/settings/members': ['Settings', 'Members'],
  '/settings/billing': ['Settings', 'Billing'],
}

export function AppLayout({
  orgName,
  orgPlan,
  usageCount,
  usageLimit,
  userName,
  children,
}: AppLayoutProps) {
  const pathname = usePathname()
  const crumbs = ROUTE_CRUMBS[pathname] ?? [pathname.split('/').filter(Boolean).pop() ?? 'App']

  return (
    <Shell
      topbarCrumbs={crumbs}
      orgName={orgName}
      orgPlan={orgPlan}
      usageCount={usageCount}
      usageLimit={usageLimit}
      userName={userName}
    >
      {children}
    </Shell>
  )
}
