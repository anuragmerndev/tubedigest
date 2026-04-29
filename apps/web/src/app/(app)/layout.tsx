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

  if (token) {
    const [orgResult, usageResult] = await Promise.allSettled([
      api.getOrg(token),
      api.getUsageCurrent(token),
    ])
    if (orgResult.status === 'fulfilled') {
      orgName = orgResult.value.name
      orgPlan = orgResult.value.plan
    }
    if (usageResult.status === 'fulfilled') {
      usageCount = usageResult.value.count
      usageLimit = usageResult.value.limit
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
    >
      {children}
    </AppLayout>
  )
}
