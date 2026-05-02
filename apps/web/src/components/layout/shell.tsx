import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface ShellProps {
  children: React.ReactNode
  topbarCrumbs: string[]
  topbarActions?: React.ReactNode
  orgName?: string
  orgPlan?: string
  usageCount?: number
  usageLimit?: number
  userName?: string
}

export function Shell({
  children,
  topbarCrumbs,
  topbarActions,
  orgName,
  orgPlan,
  usageCount,
  usageLimit,
  userName,
}: ShellProps) {
  return (
    <div className="flex h-full min-h-0">
      <Sidebar
        orgName={orgName}
        orgPlan={orgPlan}
        usageCount={usageCount}
        usageLimit={usageLimit}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar crumbs={topbarCrumbs} actions={topbarActions} userName={userName} orgPlan={orgPlan} />
        <main className="flex-1 overflow-y-auto td-scroll">{children}</main>
      </div>
    </div>
  )
}
