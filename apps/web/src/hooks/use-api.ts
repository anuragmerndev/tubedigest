'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  api,
  ApiError,
  type Invitation,
  type Member,
  type Organization,
  type Subscription,
  type SummaryList,
  type SummaryResult,
  type SyncUserResult,
  type UsageCurrent,
  type UsageDaily,
  type UserRole,
  type UserSummary,
} from '@/lib/api'

// ─── Generic query state ──────────────────────────────────────────────────────

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

type QueryAction<T> =
  | { type: 'loading' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: ApiError }

function queryReducer<T>(
  _state: QueryState<T>,
  action: QueryAction<T>,
): QueryState<T> {
  switch (action.type) {
    case 'loading':
      return { data: null, loading: true, error: null }
    case 'success':
      return { data: action.data, loading: false, error: null }
    case 'error':
      return { data: null, loading: false, error: action.error }
  }
}

function useQuery<T>(fetcher: (token: string) => Promise<T>) {
  const { getToken } = useAuth()
  const [state, dispatch] = useReducer(queryReducer<T>, {
    data: null,
    loading: true,
    error: null,
  })
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const refetch = useCallback(async () => {
    dispatch({ type: 'loading' })
    try {
      const token = await getToken()
      if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
      const data = await fetcherRef.current(token)
      dispatch({ type: 'success', data })
    } catch (e) {
      dispatch({ type: 'error', error: e as ApiError })
    }
  }, [getToken])

  useEffect(() => {
    let cancelled = false
    getToken().then((token) => {
      if (cancelled || !token) return
      fetcherRef
        .current(token)
        .then((data) => {
          if (!cancelled) dispatch({ type: 'success', data })
        })
        .catch((e) => {
          if (!cancelled) dispatch({ type: 'error', error: e as ApiError })
        })
    })
    return () => {
      cancelled = true
    }
  }, [getToken])

  return { ...state, refetch }
}

// ─── Org ──────────────────────────────────────────────────────────────────────

export function useOrg() {
  return useQuery<Organization>((t) => api.getOrg(t))
}

export function useUpdateOrg() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const update = useCallback(
    async (name: string): Promise<Organization> => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
        return await api.updateOrg(token, name)
      } catch (e) {
        setError(e as ApiError)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  return { update, loading, error }
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function useMembers() {
  return useQuery<Member[]>((t) => api.getMembers(t))
}

export function useRemoveMember() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const remove = useCallback(
    async (memberId: string): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
        await api.removeMember(token, memberId)
      } catch (e) {
        setError(e as ApiError)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  return { remove, loading, error }
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export function useInvitations() {
  return useQuery<Invitation[]>((t) => api.getInvitations(t))
}

export function useInviteMember() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const invite = useCallback(
    async (email: string, role: UserRole): Promise<Invitation> => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
        return await api.inviteMember(token, email, role)
      } catch (e) {
        setError(e as ApiError)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  return { invite, loading, error }
}

export function useCancelInvitation() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const cancel = useCallback(
    async (invitationId: string): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
        await api.cancelInvitation(token, invitationId)
      } catch (e) {
        setError(e as ApiError)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  return { cancel, loading, error }
}

// ─── Summaries ────────────────────────────────────────────────────────────────

export function useSummaries(page = 1, limit = 20) {
  return useQuery<SummaryList>((t) => api.getSummaries(t, page, limit))
}

export function useSummary(id: string) {
  return useQuery<UserSummary>((t) => api.getSummary(t, id))
}

export function useSubmitSummary() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const submit = useCallback(
    async (url: string): Promise<SummaryResult> => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
        return await api.submitSummary(token, url)
      } catch (e) {
        setError(e as ApiError)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  return { submit, loading, error }
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export function useSubscription() {
  return useQuery<Subscription | null>((t) => api.getSubscription(t))
}

export function useBillingCheckout() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const checkout = useCallback(async (): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
      const { checkout_url } = await api.createCheckout(token)
      return checkout_url
    } catch (e) {
      setError(e as ApiError)
      throw e
    } finally {
      setLoading(false)
    }
  }, [getToken])

  return { checkout, loading, error }
}

export function useBillingPortal() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const openPortal = useCallback(async (): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
      const { link } = await api.getBillingPortal(token)
      return link
    } catch (e) {
      setError(e as ApiError)
      throw e
    } finally {
      setLoading(false)
    }
  }, [getToken])

  return { openPortal, loading, error }
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export function useUsageCurrent() {
  return useQuery<UsageCurrent>((t) => api.getUsageCurrent(t))
}

export function useUsageDaily() {
  return useQuery<UsageDaily>((t) => api.getUsageDaily(t))
}

// ─── Auth sync ────────────────────────────────────────────────────────────────

export function useSyncUser() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const sync = useCallback(async (): Promise<SyncUserResult> => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
      return await api.syncUser(token)
    } catch (e) {
      setError(e as ApiError)
      throw e
    } finally {
      setLoading(false)
    }
  }, [getToken])

  return { sync, loading, error }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export function useCreateOrg() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const create = useCallback(
    async (name: string): Promise<Organization> => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated')
        return await api.createOrg(token, name)
      } catch (e) {
        setError(e as ApiError)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  return { create, loading, error }
}
