'use client'

import { useSignUp, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

type Stage = 'credentials' | 'verify'

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp()
  const { setActive } = useClerk()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const isReady = fetchStatus !== 'fetching'

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    if (!isReady) return
    setLoading(true)
    setError('')
    try {
      const { error: pwError } = await signUp.password({ emailAddress: email, password })
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
        router.push('/onboarding')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    if (!isReady) return
    setOauthLoading(true)
    try {
      const { error: ssoError } = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectCallbackUrl: `${window.location.origin}/onboarding`,
      })
      if (ssoError) {
        setError(ssoError.message)
        setOauthLoading(false)
      }
    } catch {
      setError('Google sign up failed.')
      setOauthLoading(false)
    }
  }

  if (stage === 'verify') {
    return (
      <div className="bg-card border border-border rounded-xl p-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] mb-1">Check your email</h1>
        <p className="text-[13.5px] text-td-text-muted mb-6">
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
              buttonVariants({ size: 'md' }),
              'w-full justify-center mt-1 disabled:opacity-50',
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
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] mb-1">Create your account</h1>
      <p className="text-[13.5px] text-td-text-muted mb-6">Start with 20 free summaries a month.</p>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={oauthLoading || !isReady}
        className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border border-border bg-td-surface2 text-[13.5px] font-medium hover:bg-accent transition-colors disabled:opacity-50 mb-5"
      >
        <GoogleIcon />
        {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[12px] text-td-text-dim">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleCredentials} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={14} />}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={14} />}
          required
          autoComplete="new-password"
          minLength={8}
        />

        {error && (
          <div className="flex items-center gap-2 text-destructive text-[12.5px] bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
            <AlertCircle size={13} className="shrink-0" />
            {error}
          </div>
        )}

        <p className="text-[12px] text-td-text-dim -mt-1">
          By signing up you agree to our{' '}
          <Link href="#" className="text-td-text-muted hover:text-foreground">Terms</Link>{' '}
          and{' '}
          <Link href="#" className="text-td-text-muted hover:text-foreground">Privacy Policy</Link>.
        </p>

        <button
          type="submit"
          disabled={loading || !isReady}
          className={cn(
            buttonVariants({ size: 'md' }),
            'w-full justify-center mt-1 disabled:opacity-50',
          )}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-[13px] text-td-text-muted mt-5">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
