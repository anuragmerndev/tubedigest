'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowRight, Sparkles, Users, Check, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// ─── Shell ────────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Create account', 'Create workspace', "You're in"]

function OnboardingShell({
  step,
  visual,
  children,
}: {
  step: number
  visual: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* Left: form */}
      <div className="flex flex-col px-12 py-8 min-h-screen">
        <div className="flex justify-between items-center">
          <Logo size={22} />
          <span className="text-[12.5px] text-td-text-muted">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto">
          {/* Step pills */}
          <div className="flex gap-2 mb-8">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[3px] rounded-full transition-colors duration-200"
                style={{ background: i <= step ? 'var(--primary)' : 'var(--td-surface2)' }}
              />
            ))}
          </div>
          <div className="font-mono-td text-[11px] text-td-text-dim mb-2.5">
            STEP {String(step + 1).padStart(2, '0')} / 03
          </div>
          {children}
        </div>

        <div className="flex justify-between text-[11.5px] text-td-text-dim">
          <span>© 2026 TubeDigest</span>
          <span className="flex gap-3.5">
            <span>Privacy</span>
            <span>Terms</span>
          </span>
        </div>
      </div>

      {/* Right: visual */}
      <div
        className="relative overflow-hidden border-l border-border"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.18), transparent 60%), var(--td-bg-elev)' }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
          }}
        />
        {visual}
      </div>
    </div>
  )
}

// ─── Visuals ──────────────────────────────────────────────────────────────────

function VisualTestimonial() {
  return (
    <div className="absolute inset-0 p-12 flex flex-col justify-end">
      <svg width="40" height="32" viewBox="0 0 40 32" className="text-primary mb-5">
        <path d="M0 32V16C0 7 7 0 16 0v6c-5 0-9 4-9 10h9v16H0zm24 0V16c0-9 7-16 16-16v6c-5 0-9 4-9 10h9v16H24z" fill="currentColor"/>
      </svg>
      <p className="text-[24px] leading-snug font-medium tracking-[-0.015em] mb-6 max-w-[440px]">
        We went from spending three hours on competitive research every Monday to ten minutes.
        The cache across our org is the hidden superpower.
      </p>
      <div className="flex items-center gap-3">
        <Avatar name="Maya Rivera" size={36} />
        <div>
          <div className="text-[13.5px] font-medium">Maya Rivera</div>
          <div className="text-[12px] text-td-text-muted">Head of Research, Orbit Labs</div>
        </div>
      </div>
    </div>
  )
}

function VisualWorkspacePreview({ orgName }: { orgName: string }) {
  const displayName = orgName || 'Acme Creative'
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-workspace'
  const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="absolute inset-0 p-12 flex flex-col justify-center gap-[18px]">
      <div className="font-mono-td text-[12px] text-td-text-dim tracking-[0.04em]">LIVE PREVIEW</div>
      <div className="w-[380px] max-w-full bg-card border border-border rounded-xl p-[18px]">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[10px] grid place-items-center text-white text-[17px] font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
          >
            {initials || 'WS'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium truncate">{displayName}</div>
            <div className="font-mono-td text-[12px] text-td-text-dim truncate">
              tubedigest.com/<span className="text-primary">{slug}</span>
            </div>
          </div>
          <Badge tone="success">Available</Badge>
        </div>
        <div className="h-px bg-border my-4" />
        <div className="flex justify-between text-[12px] text-td-text-muted">
          <div>
            <div className="text-td-text-dim text-[11px] mb-0.5">Plan</div>
            <div className="text-foreground font-medium">Free · 20 / mo</div>
          </div>
          <div>
            <div className="text-td-text-dim text-[11px] mb-0.5">Seats</div>
            <div className="text-foreground font-medium">1 of 1</div>
          </div>
          <div>
            <div className="text-td-text-dim text-[11px] mb-0.5">Region</div>
            <div className="text-foreground font-medium">us-east-1</div>
          </div>
        </div>
      </div>
      <p className="text-[12.5px] text-td-text-muted max-w-[380px] leading-relaxed">
        The slug becomes your workspace URL and is used on invites, webhooks, and the API.
        You can change it later from settings.
      </p>
    </div>
  )
}

function VisualReady() {
  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-6">
      <div
        className="w-[120px] h-[120px] rounded-[28px] grid place-items-center"
        style={{
          background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
          boxShadow: '0 20px 60px rgba(139,92,246,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <svg width="50" height="50" viewBox="0 0 10 10">
          <path d="M2.2 1.5 L8.2 5 L2.2 8.5 Z" fill="#fff"/>
        </svg>
      </div>
      <div className="font-mono-td text-[11px] text-primary tracking-[0.1em]">WORKSPACE READY</div>
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const USE_CASES = [
  { id: 'research', label: 'Research', desc: 'Competitive intel' },
  { id: 'learning', label: 'Learning', desc: 'Courses & talks' },
  { id: 'client', label: 'Client work', desc: 'Briefs & reviews' },
  { id: 'media', label: 'Media monitoring', desc: 'Track coverage' },
]

function StepCreateWorkspace({
  orgName,
  onOrgNameChange,
  onSubmit,
  loading,
  error,
}: {
  orgName: string
  onOrgNameChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
  error: string
}) {
  const [useCase, setUseCase] = useState('research')

  return (
    <div>
      <h1 className="text-[32px] tracking-[-0.025em] font-semibold mb-2.5">Create a workspace</h1>
      <p className="text-[14px] text-td-text-muted mb-7 leading-relaxed">
        Your workspace is where summaries live and billing happens.
        You can create more later.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[12px] text-td-text-muted block mb-1.5">Workspace name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => onOrgNameChange(e.target.value)}
            placeholder="Acme Creative"
            className="w-full h-[42px] bg-card border border-border rounded-lg px-3.5 text-[13.5px] text-foreground placeholder:text-td-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-[12px] text-td-text-muted block mb-1.5">What will you use TubeDigest for?</label>
          <div className="grid grid-cols-2 gap-2">
            {USE_CASES.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setUseCase(o.id)}
                className="p-3 rounded-lg text-left transition-colors"
                style={{
                  border: `1px solid ${o.id === useCase ? 'var(--primary)' : 'var(--border)'}`,
                  background: o.id === useCase ? 'var(--td-primary-dim)' : 'var(--card)',
                }}
              >
                <div className="text-[13px] font-medium mb-0.5">{o.label}</div>
                <div className="text-[11.5px] text-td-text-muted">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-destructive text-[12.5px] bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !orgName.trim()}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'w-full justify-center gap-2 mt-6 disabled:opacity-50',
        )}
      >
        {loading ? 'Creating…' : 'Create workspace'} {!loading && <ArrowRight size={13} />}
      </button>
    </div>
  )
}

function StepWelcome({ orgName, router }: { orgName: string; router: ReturnType<typeof useRouter> }) {
  const tasks = [
    { done: true, n: '1', title: 'Workspace created', desc: `${orgName || 'My Workspace'} · Free plan` },
    { done: false, n: '2', title: 'Run your first summary', desc: 'Paste any YouTube URL. It takes under 10 seconds.' },
    { done: false, n: '3', title: 'Invite your team', desc: 'Summaries are cached across members. Bring the whole crew.' },
  ]

  return (
    <div>
      <h1 className="text-[32px] tracking-[-0.025em] font-semibold mb-2.5">
        You&apos;re all set.
      </h1>
      <p className="text-[14px] text-td-text-muted mb-8 leading-relaxed">
        {orgName || 'Your workspace'} is ready. Here are two quick things to get rolling.
      </p>

      <div className="flex flex-col gap-2.5 mb-7">
        {tasks.map((t) => (
          <div
            key={t.n}
            className="flex items-center gap-3 p-3.5 rounded-[9px] border border-border"
            style={{
              background: t.done ? 'var(--card)' : 'var(--td-bg-elev)',
              opacity: t.done ? 0.75 : 1,
            }}
          >
            <div
              className="w-7 h-7 rounded-[7px] grid place-items-center text-[12px] font-semibold font-mono-td shrink-0"
              style={{
                background: t.done ? 'var(--td-success)' : 'var(--td-surface2)',
                color: t.done ? '#fff' : 'var(--td-text-muted)',
                border: t.done ? 'none' : '1px solid var(--border)',
              }}
            >
              {t.done ? <Check size={14} /> : t.n}
            </div>
            <div className="flex-1">
              <div
                className="text-[13.5px] font-medium"
                style={{ textDecoration: t.done ? 'line-through' : 'none' }}
              >
                {t.title}
              </div>
              <div className="text-[12px] text-td-text-muted mt-0.5">{t.desc}</div>
            </div>
            {!t.done && <ChevronRight size={14} className="text-td-text-dim" />}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push('/summarize')}
          className={cn(buttonVariants({ size: 'lg' }), 'flex-1 justify-center gap-2')}
        >
          Run your first summary <Sparkles size={13} />
        </button>
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'gap-2')}
        >
          <Users size={13} /> Invite team
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1) // start at step 1 (workspace), step 0 = account already done
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync Clerk user to our DB on mount
  useEffect(() => {
    getToken().then((token) => {
      if (token) api.syncUser(token).catch(() => {})
    })
  }, [getToken])

  async function handleCreateOrg() {
    if (!orgName.trim()) return
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await api.createOrg(token, orgName.trim())
      setStep(2)
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err.message ?? 'Failed to create workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const visuals: Record<number, React.ReactNode> = {
    1: <VisualWorkspacePreview orgName={orgName} />,
    2: <VisualReady />,
  }

  return (
    <OnboardingShell step={step} visual={visuals[step] ?? <VisualTestimonial />}>
      {step === 1 && (
        <StepCreateWorkspace
          orgName={orgName}
          onOrgNameChange={setOrgName}
          onSubmit={handleCreateOrg}
          loading={loading}
          error={error}
        />
      )}
      {step === 2 && <StepWelcome orgName={orgName} router={router} />}
    </OnboardingShell>
  )
}
