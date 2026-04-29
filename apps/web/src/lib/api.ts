// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrgPlan = 'free' | 'pro'
export type UserRole = 'owner' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'cancelled'

// ─── Entity types (mirror backend entities) ───────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  plan: OrgPlan
  dodoCustomerId: string | null
  createdAt: string
}

export interface Member {
  id: string
  clerkId: string
  email: string
  role: UserRole
  orgId: string | null
  createdAt: string
}

export interface Invitation {
  id: string
  orgId: string
  email: string
  role: UserRole
  status: InvitationStatus
  invitedBy: string
  createdAt: string
}

export interface Subscription {
  id: string
  orgId: string
  dodoSubscriptionId: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  createdAt: string
}

export interface Video {
  id: string
  youtubeVideoId: string
  url: string
  transcript: string | null
  summary: string | null
  createdAt: string
}

export interface UserSummary {
  id: string
  userId: string
  orgId: string
  videoId: string
  createdAt: string
  video?: Video
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface SummaryResult {
  summaryId: string
  videoId: string
  url: string
  summary: string
  truncated: boolean
}

export interface SummaryList {
  data: UserSummary[]
  total: number
}

export interface UsageCurrent {
  count: number
  limit: number
  period: string
}

export type UsageDaily = Array<{ date: string; count: number }>

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      body.error ?? 'UNKNOWN',
      body.message ?? res.statusText,
    )
  }

  // All success responses are wrapped: { status, message, data }
  const envelope = await res.json()
  return (envelope.data ?? envelope) as T
}

// ─── Typed API call helpers ───────────────────────────────────────────────────

export const api = {
  // Auth
  syncUser: (token: string) =>
    apiFetch<Member>('/api/auth/sync', token, { method: 'POST' }),

  // Onboarding
  createOrg: (token: string, name: string) =>
    apiFetch<Organization>('/api/onboarding/org', token, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Orgs
  getOrg: (token: string) =>
    apiFetch<Organization>('/api/orgs/current', token),

  updateOrg: (token: string, name: string) =>
    apiFetch<Organization>('/api/orgs/current', token, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  // Members
  getMembers: (token: string) =>
    apiFetch<Member[]>('/api/members', token),

  removeMember: (token: string, memberId: string) =>
    apiFetch<void>(`/api/members/${memberId}`, token, { method: 'DELETE' }),

  // Invitations
  getInvitations: (token: string) =>
    apiFetch<Invitation[]>('/api/invitations', token),

  inviteMember: (token: string, email: string, role: UserRole) =>
    apiFetch<Invitation>('/api/invitations', token, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  cancelInvitation: (token: string, invitationId: string) =>
    apiFetch<void>(`/api/invitations/${invitationId}`, token, {
      method: 'DELETE',
    }),

  // Summaries
  submitSummary: (token: string, url: string) =>
    apiFetch<SummaryResult>('/api/summaries', token, {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  getSummaries: (token: string, page = 1, limit = 20) =>
    apiFetch<SummaryList>(`/api/summaries?page=${page}&limit=${limit}`, token),

  getSummary: (token: string, id: string) =>
    apiFetch<UserSummary>(`/api/summaries/${id}`, token),

  // Billing
  getSubscription: (token: string) =>
    apiFetch<Subscription | null>('/api/billing/subscription', token),

  createCheckout: (token: string) =>
    apiFetch<{ checkout_url: string }>('/api/billing/checkout', token, {
      method: 'POST',
    }),

  getBillingPortal: (token: string) =>
    apiFetch<{ link: string }>('/api/billing/portal', token, {
      method: 'POST',
    }),

  // Usage
  getUsageCurrent: (token: string) =>
    apiFetch<UsageCurrent>('/api/usage/current', token),

  getUsageDaily: (token: string) =>
    apiFetch<UsageDaily>('/api/usage/daily', token),
}
