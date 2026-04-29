'use client'

import { useSignIn, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/logo'
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

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn()
  const { setActive } = useClerk()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const isReady = fetchStatus !== 'fetching'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isReady) return
    setLoading(true)
    setError('')
    try {
      const { error: signInError } = await signIn.password({ emailAddress: email, password })
      if (signInError) {
        setError(signInError.message)
        return
      }
      if (signIn.status === 'complete' && signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId })
        router.push('/dashboard')
      }
    } catch {
      setError('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    if (!isReady) return
    setOauthLoading(true)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    try {
      const { error: ssoError } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: `${appUrl}/sso-callback`,
        redirectCallbackUrl: `${appUrl}/dashboard`,
      })
      if (ssoError) {
        setError(ssoError.message)
        setOauthLoading(false)
      }
    } catch {
      setError('Google sign in failed.')
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.08), transparent 55%)',
        }}
      />
      <div className="relative w-full max-w-[380px]">
        <div className="flex justify-center mb-8">
          <Logo size={22} />
        </div>
    <div className="bg-card border border-border rounded-xl p-8">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] mb-1">Welcome back</h1>
      <p className="text-[13.5px] text-td-text-muted mb-6">Sign in to your TubeDigest account.</p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          autoComplete="current-password"
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Clerk CAPTCHA widget */}
      <div id="clerk-captcha" className="mt-3" />

      <p className="text-center text-[13px] text-td-text-muted mt-5">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
      </div>
    </div>
  )
}
