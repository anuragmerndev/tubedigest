'use client'

import { useSignUp, useClerk } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, AlertCircle, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.83-.26.83-.58v-2c-3.34.73-4.04-1.6-4.04-1.6-.54-1.4-1.33-1.76-1.33-1.76-1.1-.74.08-.73.08-.73 1.2.1 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.95 0-1.3.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.17 0 0 1-.32 3.3 1.23.96-.27 2-.4 3-.4s2.04.13 3 .4c2.28-1.55 3.3-1.23 3.3-1.23.64 1.65.24 2.86.1 3.17.77.84 1.23 1.92 1.23 3.22 0 4.6-2.8 5.63-5.47 5.93.43.37.8 1.1.8 2.22v3.3c0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

function QuoteIcon() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" className="text-primary mb-5">
      <path d="M0 32V16C0 7 7 0 16 0v6c-5 0-9 4-9 10h9v16H0zm24 0V16c0-9 7-16 16-16v6c-5 0-9 4-9 10h9v16H24z" fill="currentColor"/>
    </svg>
  )
}

type Stage = 'credentials' | 'verify'

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp()
  const { setActive } = useClerk()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [stage, setStage] = useState<Stage>('credentials')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  const isReady = fetchStatus !== 'fetching'

  // Preserve URL param through auth flow
  const prefillUrl = searchParams.get('url')
  const postAuthRedirect = prefillUrl
    ? `/onboarding?url=${encodeURIComponent(prefillUrl)}`
    : '/onboarding'

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    if (!isReady) return
    setLoading(true)
    setError('')
    try {
      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const { error: pwError } = await signUp.password({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })
      if (pwError) { setError(pwError.message); return }
      const { error: codeError } = await signUp.verifications.sendEmailCode()
      if (codeError) { setError(codeError.message); return }
      setStage('verify')
    } catch {
      setError('Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!isReady) return
    setLoading(true)
    setError('')
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code })
      if (verifyError) { setError(verifyError.message); return }
      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId })
        router.push(postAuthRedirect)
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_github') {
    if (!isReady) return
    setOauthLoading(strategy === 'oauth_google' ? 'google' : 'github')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    try {
      const { error: ssoError } = await signUp.sso({
        strategy,
        redirectUrl: `${appUrl}/sso-callback`,
        redirectCallbackUrl: `${appUrl}${postAuthRedirect}`,
      })
      if (ssoError) {
        setError(ssoError.message)
        setOauthLoading(null)
      }
    } catch {
      setError('OAuth sign up failed.')
      setOauthLoading(null)
    }
  }

  const stepIndex = stage === 'credentials' ? 0 : 0

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
      {/* Left: form panel */}
      <div className="flex flex-col px-8 py-8 lg:px-12" style={{ minHeight: 780 }}>
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <Logo size={22} />
          <div className="text-[12.5px] text-td-text-muted">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-[420px] mx-auto">
          {/* Step pills */}
          <div className="flex gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 h-[3px] rounded-sm transition-colors"
                style={{
                  background: i <= stepIndex ? 'var(--td-primary)' : 'var(--td-surface2)',
                }}
              />
            ))}
          </div>
          <div className="font-mono-td text-[11px] text-td-text-dim mb-2.5 tracking-[0.06em]">
            STEP 01 / 03
          </div>

          {stage === 'verify' ? (
            /* Verify stage */
            <>
              <h1 className="text-[32px] font-semibold tracking-[-0.025em] mb-2.5">
                Check your email
              </h1>
              <p className="text-[14px] text-td-text-muted mb-7">
                We sent a verification code to{' '}
                <span className="text-foreground font-medium">{email}</span>.
              </p>

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  icon={<KeyRound size={14} />}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                />

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-[12.5px] bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                    <AlertCircle size={13} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isReady}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full justify-center mt-2 disabled:opacity-50',
                  )}
                >
                  {loading ? 'Verifying…' : 'Verify email'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setStage('credentials'); setError('') }}
                className="w-full text-center text-[13px] text-td-text-muted mt-4 hover:text-foreground transition-colors"
              >
                ← Use a different email
              </button>
            </>
          ) : (
            /* Credentials stage */
            <>
              <h1 className="text-[32px] font-semibold tracking-[-0.025em] mb-2.5">
                Create your account
              </h1>
              <p className="text-[14px] text-td-text-muted mb-7">
                Start with 10 free summaries. No credit card required.
              </p>

              {/* OAuth buttons */}
              <div className="flex flex-col gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => handleOAuth('oauth_google')}
                  disabled={oauthLoading !== null || !isReady}
                  className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg border border-border bg-td-surface2 text-[13.5px] font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <GoogleIcon />
                  {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('oauth_github')}
                  disabled={oauthLoading !== null || !isReady}
                  className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg border border-border bg-td-surface2 text-[13.5px] font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <GitHubIcon />
                  {oauthLoading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="font-mono-td text-[11px] text-td-text-dim">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Form fields */}
              <form onSubmit={handleCredentials} className="flex flex-col gap-2.5">
                <div>
                  <label className="text-[12px] text-td-text-muted mb-1.5 block">Full name</label>
                  <Input
                    type="text"
                    placeholder="Elena Park"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    icon={<User size={14} />}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-td-text-muted mb-1.5 block">Work email</label>
                  <Input
                    type="email"
                    placeholder="elena@acmecreative.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={14} />}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-td-text-muted mb-1.5 block">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={14} />}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-[12.5px] bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                    <AlertCircle size={13} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isReady}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full justify-center mt-2 disabled:opacity-50',
                  )}
                >
                  {loading ? 'Creating account…' : 'Continue'}
                </button>
              </form>

              {/* Clerk CAPTCHA widget */}
              <div id="clerk-captcha" className="mt-3" />

              <p className="text-[11.5px] text-td-text-dim text-center mt-4 leading-relaxed">
                By continuing, you agree to our{' '}
                <Link href="#" className="text-td-text-muted hover:text-foreground">Terms of Service</Link>{' '}
                and{' '}
                <Link href="#" className="text-td-text-muted hover:text-foreground">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between text-[11.5px] text-td-text-dim">
          <span>&copy; 2026 TubeDigest</span>
          <span className="flex gap-3.5">
            <Link href="#" className="hover:text-td-text-muted">Privacy</Link>
            <Link href="#" className="hover:text-td-text-muted">Terms</Link>
          </span>
        </div>
      </div>

      {/* Right: testimonial panel */}
      <div
        className="relative overflow-hidden border-l border-border hidden lg:block"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.18), transparent 60%), var(--td-bg-elev)',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(var(--td-border) 1px, transparent 1px), linear-gradient(90deg, var(--td-border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.3,
            maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
          }}
        />
        {/* Testimonial */}
        <div className="absolute inset-0 p-12 flex flex-col justify-end">
          <QuoteIcon />
          <div className="text-[24px] leading-[1.35] font-medium tracking-[-0.015em] mb-6 max-w-[440px]">
            We went from spending three hours on competitive research every Monday to ten minutes.
            The cache across our org is the hidden superpower.
          </div>
          <div className="flex items-center gap-3">
            <Avatar name="Maya Rivera" size={36} />
            <div>
              <div className="text-[13.5px] font-medium">Maya Rivera</div>
              <div className="text-[12px] text-td-text-muted">Head of Research, Orbit Labs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
