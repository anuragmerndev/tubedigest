import { auth, currentUser } from '@clerk/nextjs/server'
import { AppLayout } from '@/components/app-layout'
import { api } from '@/lib/api'

export default async function AppRootLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = await auth()
  const token = await getToken()
  const clerkUser = await currentUser()

  let orgName: string | undefined
  let orgPlan: string | undefined
  let usageCount: number | undefined
  let usageLimit: number | undefined
  let userRole: string | undefined

  if (token) {
    const [orgResult, usageResult, syncResult] = await Promise.allSettled([
      api.getOrg(token),
      api.getUsageCurrent(token),
      api.syncUser(token),
    ])
    if (orgResult.status === 'fulfilled') {
      orgName = orgResult.value.name
      orgPlan = orgResult.value.plan
    }
    if (usageResult.status === 'fulfilled') {
      usageCount = usageResult.value.count
      usageLimit = usageResult.value.limit
    }
    if (syncResult.status === 'fulfilled') {
      userRole = syncResult.value.role ?? undefined
    }
  }

  const userName = clerkUser?.emailAddresses?.[0]?.emailAddress ?? clerkUser?.firstName ?? undefined

  return (
    <AppLayout
      orgName={orgName}
      orgPlan={orgPlan}
      usageCount={usageCount}
      usageLimit={usageLimit}
      userName={userName}
      userRole={userRole}
    >
      {children}
    </AppLayout>
  )
}
