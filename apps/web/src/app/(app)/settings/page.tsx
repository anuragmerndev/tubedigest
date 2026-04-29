'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import {
  useOrg,
  useUpdateOrg,
  useMembers,
  useInvitations,
  useInviteMember,
  useCancelInvitation,
  useRemoveMember,
  useUsageCurrent,
  useSubscription,
  useBillingPortal,
  useBillingCheckout,
} from '@/hooks/use-api'
import type { UserRole } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlus({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconCard({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 7.5h15" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconBolt({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M10 2L4 10h6l-2 6 8-8h-6l2-8z" fill="currentColor" opacity="0.85"/>
    </svg>
  )
}

function IconExtern({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7M7 1h4m0 0v4M11 1 5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconMenu({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="3" r="1" fill="currentColor"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
      <circle cx="7" cy="11" r="1" fill="currentColor"/>
    </svg>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'members' | 'billing' | 'general'

interface TabBarProps {
  active: Tab
  onChange: (t: Tab) => void
  memberCount?: number
}

function TabBar({ active, onChange, memberCount }: TabBarProps) {
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'members', label: 'Members', count: memberCount },
    { id: 'billing', label: 'Billing' },
    { id: 'general', label: 'General' },
  ]
  return (
    <div className="flex gap-0.5 border-b border-border mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'px-4 py-2.5 text-[13.5px] font-medium border-b-2 transition-colors -mb-px',
            active === t.id
              ? 'border-primary text-td-text'
              : 'border-transparent text-td-text-muted hover:text-td-text',
          )}
        >
          {t.label}
          {t.count != null && (
            <span className="ml-1.5 font-mono-td text-[11px] text-td-text-dim">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const { data: members, loading: membersLoading, refetch: refetchMembers } = useMembers()
  const { data: invitations, loading: invitationsLoading, refetch: refetchInvitations } = useInvitations()
  const { invite, loading: inviting } = useInviteMember()
  const { cancel, loading: cancelling } = useCancelInvitation()
  const { remove, loading: removing } = useRemoveMember()

  const pendingInvitations = (invitations ?? []).filter((inv) => inv.status === 'pending')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setInviteError('')
    setInviteSuccess(false)
    try {
      await invite(email.trim(), role)
      setEmail('')
      setInviteSuccess(true)
      refetchInvitations()
      setTimeout(() => setInviteSuccess(false), 3000)
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite')
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancel(id)
      refetchInvitations()
    } catch {
      /* noop */
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm('Remove this member?')) return
    try {
      await remove(id)
      refetchMembers()
    } catch {
      /* noop */
    }
  }

  const allRows = [
    ...(members ?? []).map((m) => ({ ...m, isPending: false })),
    ...pendingInvitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      orgId: inv.orgId,
      clerkId: '',
      createdAt: inv.createdAt,
      isPending: true,
      invitationId: inv.id,
    })),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Invite card */}
      <Card padding={18}>
        <form onSubmit={handleInvite}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[13.5px] font-medium mb-0.5">Invite teammates</div>
              <div className="text-[12.5px] text-td-text-muted">Invitees get 30 days to accept.</div>
            </div>
            <div style={{ width: 300 }}>
              <Input
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviting}
              />
            </div>
            {/* Role selector */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={cn(
                'h-9 px-2.5 pr-8 border border-border rounded-lg text-[12.5px] bg-card text-td-text',
                'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'appearance-none cursor-pointer',
              )}
              style={{ minWidth: 90 }}
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
            <Button type="submit" size="md" disabled={inviting || !email.trim()}>
              <IconPlus size={12} />
              {inviting ? 'Inviting…' : 'Invite'}
            </Button>
          </div>
          {inviteError && (
            <div className="mt-2.5 text-[12px] text-destructive">{inviteError}</div>
          )}
          {inviteSuccess && (
            <div className="mt-2.5 text-[12px] text-td-success">Invitation sent!</div>
          )}
        </form>
      </Card>

      {/* Member list */}
      <Card padding={0}>
        {/* Header */}
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-border">
          <div className="text-[13.5px] font-medium">
            Members{' '}
            <span className="text-td-text-muted font-normal">
              · {membersLoading ? '…' : (members?.length ?? 0) + pendingInvitations.length}
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid px-[18px] py-2.5 font-mono-td text-[11px] text-td-text-muted uppercase tracking-[0.05em] border-b border-border"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 40px',
            background: 'var(--td-bg-elev)',
          }}
        >
          <div>Member</div>
          <div>Role</div>
          <div>Joined</div>
          <div />
        </div>

        {/* Rows */}
        {membersLoading || invitationsLoading ? (
          <div className="px-[18px] py-6 text-[12px] text-td-text-dim">Loading…</div>
        ) : allRows.length === 0 ? (
          <div className="px-[18px] py-6 text-[12px] text-td-text-dim">No members yet.</div>
        ) : (
          allRows.map((m, i) => {
            const isLast = i === allRows.length - 1
            const joined = new Date(m.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            return (
              <div
                key={m.id}
                className={cn(
                  'grid px-[18px] py-3 items-center gap-2',
                  !isLast && 'border-b border-border',
                )}
                style={{ gridTemplateColumns: '2fr 1fr 1fr 40px' }}
              >
                {/* Member col */}
                <div className="flex gap-2.5 items-center">
                  <Avatar name={m.email} size={28} />
                  <div>
                    <div className="text-[13px] font-medium text-td-text">{m.email}</div>
                    {m.isPending && (
                      <div className="text-[11px] text-td-warn mt-0.5">Invite pending</div>
                    )}
                  </div>
                </div>
                {/* Role col */}
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 text-[12px] rounded-md border',
                      m.role === 'owner'
                        ? 'bg-td-primary-dim border-td-primary-border text-primary'
                        : 'bg-td-surface2 border-border text-td-text',
                    )}
                  >
                    {m.role === 'owner' ? 'Owner' : 'Member'}
                  </span>
                </div>
                {/* Date col */}
                <div className="text-[12.5px] text-td-text-muted">{joined}</div>
                {/* Actions col */}
                <div className="flex justify-end">
                  {m.isPending ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancelling}
                      onClick={() => handleCancel((m as unknown as { invitationId: string }).invitationId)}
                    >
                      Cancel
                    </Button>
                  ) : m.role !== 'owner' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removing}
                      onClick={() => handleRemove(m.id)}
                      title="Remove member"
                    >
                      <IconMenu size={14} />
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}

// ─── Billing tab (MVP) ────────────────────────────────────────────────────────

function UsageMeter({ label, value, limit, pct }: {
  label: string; value: string; limit: string; pct: number | null
}) {
  return (
    <div>
      <div className="font-mono-td text-[11.5px] text-td-text-muted uppercase tracking-[0.04em] mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <div className="text-[24px] font-semibold tracking-[-0.02em]">{value}</div>
        <div className="text-[12px] text-td-text-muted">/ {limit}</div>
      </div>
      {pct != null && (
        <div className="h-[5px] bg-td-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function BillingTab() {
  const { data: org } = useOrg()
  const { data: usage } = useUsageCurrent()
  const { data: subscription } = useSubscription()
  const { openPortal, loading: portalLoading } = useBillingPortal()
  const { checkout, loading: checkoutLoading } = useBillingCheckout()

  const isPro = org?.plan === 'pro'
  const count = usage?.count ?? 0
  const limit = usage?.limit ?? 500
  const pct = limit > 0 ? (count / limit) * 100 : 0

  const renewDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  async function handlePortal() {
    try {
      const url = await openPortal()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      /* noop */
    }
  }

  async function handleCheckout() {
    try {
      const url = await checkout()
      window.location.href = url
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current plan */}
      <Card padding={0}>
        <div
          className="p-[22px] border-b border-border"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(139,92,246,0.10), transparent 60%)',
          }}
        >
          <Badge tone="primary" className="mb-1.5">Current plan</Badge>
          <div className="text-[24px] font-semibold tracking-[-0.02em]">
            {isPro ? 'Pro · $29 / month' : 'Free'}
          </div>
          <div className="text-[13px] text-td-text-muted mt-1">
            {renewDate ? (
              <>Renews <span className="text-td-text">{renewDate}</span> · billed via Dodo</>
            ) : (
              'No active subscription'
            )}
          </div>
        </div>

        <div className="p-[22px]">
          <div className="text-[13px] font-medium mb-3.5">
            Usage this period ·{' '}
            <span className="text-td-text-muted font-normal">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <UsageMeter
              label="Summaries"
              value={String(count)}
              limit={`${limit} included`}
              pct={pct}
            />
            <UsageMeter label="Seats" value="—" limit="unlimited" pct={null} />
          </div>
        </div>
      </Card>

      {/* Dodo portal */}
      <Card padding={22}>
        <div className="flex items-center gap-4">
          <div
            className="grid place-items-center shrink-0"
            style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--td-primary-dim)',
              border: '1px solid var(--td-primary-border)',
              color: 'var(--td-primary)',
            }}
          >
            <IconCard size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">Manage payment method &amp; invoices</div>
            <div className="text-[12.5px] text-td-text-muted mt-0.5">
              Cards, billing address, tax IDs, and downloadable invoices live in your Dodo customer portal.
            </div>
          </div>
          <Button size="md" onClick={handlePortal} disabled={portalLoading}>
            <IconExtern size={12} />
            {portalLoading ? 'Opening…' : 'Open Dodo portal'}
          </Button>
        </div>
      </Card>

      {/* Upgrade / change plan */}
      <Card padding={22}>
        <div className="flex items-center gap-4">
          <div
            className="grid place-items-center shrink-0"
            style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--td-surface2)',
              border: '1px solid var(--td-border)',
              color: 'var(--td-text-muted)',
            }}
          >
            <IconBolt size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">
              {isPro ? 'Need more than 500 summaries / month?' : 'Upgrade to Pro'}
            </div>
            <div className="text-[12.5px] text-td-text-muted mt-0.5">
              {isPro
                ? <>Switch to usage-based billing at <span className="font-mono-td text-td-text">$0.04 / summary</span> after the included pool.</>
                : 'Get 500 summaries/month, priority processing, and team access.'}
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Loading…' : isPro ? 'Change plan' : 'Upgrade to Pro'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── General tab (MVP) ────────────────────────────────────────────────────────

function GeneralTab() {
  const { data: org } = useOrg()
  const { update, loading: saving } = useUpdateOrg()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const nameValue = name || org?.name || ''

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) return
    setSaveError('')
    setSaved(false)
    try {
      await update(nameValue.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Workspace name */}
      <Card padding={0}>
        <div className="px-[22px] py-[18px] border-b border-border">
          <div className="text-[14px] font-medium">Workspace name</div>
          <div className="text-[12.5px] text-td-text-muted mt-0.5">
            Shown in the sidebar, on invites, and in your Dodo billing.
          </div>
        </div>
        <form
          onSubmit={handleSave}
          className="grid items-center gap-3 px-[22px] py-[18px]"
          style={{ gridTemplateColumns: '1fr auto' }}
        >
          <div style={{ maxWidth: 380 }}>
            <Input
              value={nameValue}
              onChange={(e) => setName(e.target.value)}
              placeholder={org?.name ?? 'Workspace name'}
              disabled={saving}
            />
            {saveError && <div className="mt-1.5 text-[12px] text-destructive">{saveError}</div>}
            {saved && <div className="mt-1.5 text-[12px] text-td-success">Saved!</div>}
          </div>
          <Button type="submit" size="md" disabled={saving || !nameValue.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card
        padding={0}
        className="border-[rgba(239,68,68,0.25)]"
      >
        <div className="px-[22px] py-[18px] border-b border-border">
          <div className="text-[14px] font-medium text-destructive">Danger zone</div>
          <div className="text-[12.5px] text-td-text-muted mt-0.5">
            Irreversible actions on this workspace.
          </div>
        </div>
        <div
          className="grid items-center gap-6 px-[22px] py-[18px]"
          style={{ gridTemplateColumns: '1fr auto' }}
        >
          <div>
            <div className="text-[13px] font-medium">Delete workspace</div>
            <div className="text-[12px] text-td-text-muted mt-0.5 leading-snug">
              Permanently deletes all summaries, members, and your Dodo subscription. This cannot be undone.
            </div>
          </div>
          <Button
            variant="destructive"
            size="md"
            onClick={() => window.alert('Contact support to delete your workspace.')}
          >
            Delete {org?.name ?? 'workspace'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('members')
  const { data: members } = useMembers()

  return (
    <div className="p-6 pb-10" style={{ maxWidth: 1060 }}>
      <div className="mb-4">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">Workspace settings</div>
        <div className="text-[13px] text-td-text-muted mt-0.5">
          Manage members, billing, and workspace preferences.
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} memberCount={members?.length} />

      {tab === 'members' && <MembersTab />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'general' && <GeneralTab />}
    </div>
  )
}
