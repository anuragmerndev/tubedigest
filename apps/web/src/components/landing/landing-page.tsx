import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Link2,
  Building2,
  CreditCard,
  Zap,
  Shield,
  Check,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { HeroInput } from './hero-input'
import { cn } from '@/lib/utils'
import { VideoThumb } from '@/components/ui/video-thumb'
import { Reveal, Counter } from './animations'

// ─── Nav ──────────────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="h-[60px] border-b border-border flex items-center px-8 gap-6 sticky top-0 z-10 bg-background/70 backdrop-blur-xl">
      <Logo size={22} />
      <nav className="flex-1 flex justify-center gap-7">
        {['Product', 'Pricing', 'Docs', 'Changelog'].map((l) => (
          <a
            key={l}
            href="#"
            className="text-td-text-muted text-[13.5px] hover:text-foreground transition-colors"
          >
            {l}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'md' })}>
          Sign in
        </Link>
        <Link href="/sign-up" className={cn(buttonVariants({ size: 'md' }), 'gap-1.5')}>
          Get started <ArrowRight size={13} />
        </Link>
      </div>
    </header>
  )
}

// ─── Hero A ───────────────────────────────────────────────────────────────────

function MiniSummarizerPreview() {
  const chapters = ['00:00 Intro', '04:12 The consumer tipping point', '11:30 Where retention happens', "22:45 What's next"]
  return (
    <div className="p-5 grid gap-5 text-left" style={{ gridTemplateColumns: '260px 1fr' }}>
      <div>
        <VideoThumb seed={1} duration="32:14" />
        <div className="text-[13px] font-medium mt-2.5 leading-snug">
          The State of AI 2026: What&apos;s actually changing
        </div>
        <div className="text-[11.5px] text-td-text-dim mt-1">
          Sequoia Capital · 32:14 · 1.2M views
        </div>
      </div>
      <div>
        <div className="flex gap-1.5 mb-3.5">
          <Badge tone="primary">TL;DR</Badge>
          <Badge tone="success">✓ Cached · 1.2s</Badge>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground">
          Consumer AI spend has caught up to enterprise for the first time — OpenAI and Anthropic
          both crossed $10B run-rate in Q1. The panel argues that coding, customer support, and
          voice are the three categories where{' '}
          <span className="bg-td-primary-dim px-1 rounded-[3px]">retention actually compounds</span>.
        </p>
        <div className="flex gap-1.5 mt-3.5 flex-wrap">
          {chapters.map((c) => (
            <div
              key={c}
              className="font-mono-td text-[11px] px-[7px] py-[3px] bg-td-surface2 border border-border rounded-[4px] text-td-text-muted"
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroA() {
  return (
    <section className="py-[80px] px-8 pb-[100px] relative overflow-hidden border-b border-border">
      {/* Drifting aurora */}
      <div
        className="td-aurora absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(139,92,246,0.12), transparent 60%)' }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />

      <div className="max-w-[1120px] mx-auto relative text-center">
        <div className="td-enter mb-[22px]" style={{ animationDelay: '0ms' }}>
        <Badge tone="primary" className="inline-flex items-center gap-1.5">
          <span className="td-dot-pulse w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          New · Team workspaces &amp; usage-based billing
        </Badge>
        </div>

        <h1
          className="td-enter text-[72px] leading-[1.02] tracking-[-0.035em] font-semibold mb-[22px]"
          style={{
            animationDelay: '80ms',
            background: 'linear-gradient(180deg, #fff 0%, #9B9BA6 130%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Summarize any YouTube
          <br />
          video in seconds.
        </h1>

        <p className="td-enter text-[18px] leading-relaxed text-td-text-muted max-w-[580px] mx-auto mb-9 tracking-[-0.005em]" style={{ animationDelay: '180ms' }}>
          TubeDigest reads videos for you. Paste a link, get a structured summary
          with chapters, timestamps, and key takeaways — ready to share with your team.
        </p>

        {/* Inline summarizer CTA */}
        <div className="td-enter max-w-[620px] mx-auto mb-4 relative" style={{ animationDelay: '280ms' }}>
          <HeroInput />
        </div>

        <div className="td-enter flex justify-center gap-4 text-td-text-dim text-[12px]" style={{ animationDelay: '380ms' }}>
          <span>&#10003; No credit card</span>
          <span>&#10003; 10 free summaries/mo</span>
          <span>&#10003; SOC 2 ready</span>
        </div>

        {/* Product preview */}
        <Reveal delay={120} style={{ marginTop: 60 }} className="relative">
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-20px -20px 40%',
              background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.25), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="border border-border rounded-[14px] bg-card p-1 relative"
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)' }}
          >
            {/* Browser chrome */}
            <div className="h-[30px] flex items-center gap-1.5 px-3 border-b border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-td-border-strong" />
              <span className="w-2.5 h-2.5 rounded-full bg-td-border-strong" />
              <span className="w-2.5 h-2.5 rounded-full bg-td-border-strong" />
              <div className="flex-1 text-center font-mono-td text-[11px] text-td-text-dim">
                app.tubedigest.com/summarize
              </div>
            </div>
            <MiniSummarizerPreview />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Logo strip (marquee) ────────────────────────────────────────────────────

function LogoStrip() {
  const names = ['NOTION', 'LINEAR', 'RETOOL', 'RAMP', 'VERCEL', 'FIGMA', 'ARC']
  const loop = [...names, ...names]
  return (
    <div className="py-10 px-8 border-b border-border">
      <div className="max-w-[1120px] mx-auto text-center">
        <Reveal className="font-mono-td text-[12px] text-td-text-dim uppercase tracking-[0.08em] mb-5">
          Teams digesting video with TubeDigest
        </Reveal>
        <div className="td-marquee-mask overflow-hidden opacity-55">
          <div className="td-marquee-track">
            {loop.map((n, i) => (
              <div key={i} className="text-[18px] font-semibold tracking-[0.04em] text-td-text-muted shrink-0">
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feature grid ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Building2,
    title: 'Multi-tenant workspaces',
    desc: 'Every summary belongs to an org. Invite teammates, share libraries, and scope usage per workspace.',
    code: 'org_k8n2··· · 12 members',
  },
  {
    icon: CreditCard,
    title: 'Usage-based billing',
    desc: 'Start on the Free tier. Upgrade to Pro for $0.04 per summary after 500 included. No surprises.',
    code: '$0.04 · per summary',
  },
  {
    icon: Sparkles,
    title: 'AI-generated summaries',
    desc: 'Claude Sonnet turns transcripts into structured TL;DRs, chapter breakdowns, and citable quotes.',
    code: 'Claude Sonnet 4.5',
  },
  {
    icon: Zap,
    title: 'Aggressively cached',
    desc: 'Already summarized? You get the result in under a second. Same video, different team — one cost.',
    code: '~1.2s · cached hit',
  },
  {
    icon: Shield,
    title: 'SSO & audit logs',
    desc: 'Google Workspace and SAML on every plan. Every summary written to an immutable audit log.',
    code: 'SAML · SCIM · SOC 2',
  },
  {
    icon: Link2,
    title: 'API & Zapier',
    desc: 'Pipe summaries into Notion, Slack, or your own tooling. REST API on Pro and above.',
    code: 'POST /v1/summaries',
  },
]

function FeatureGrid() {
  return (
    <section className="py-[100px] px-8 border-b border-border">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="text-center mb-[60px]">
          <Badge className="mb-4">Features</Badge>
          <h2 className="text-[44px] tracking-[-0.03em] font-semibold mb-3.5">
            Built for the way your team actually works
          </h2>
          <p className="text-[16px] text-td-text-muted max-w-[520px] mx-auto">
            Not just a summary tool. A shared knowledge layer for every video your team has ever watched.
          </p>
        </Reveal>
        <div className="grid grid-cols-3 border-t border-l border-border">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 70} className="td-feature-card p-7 border-r border-b border-border bg-background">
                <div className="td-feature-icon w-8 h-8 rounded-[8px] grid place-items-center bg-td-primary-dim text-primary border border-td-primary-border mb-4">
                  <Icon size={16} />
                </div>
                <div className="text-[15px] font-medium mb-1.5">{f.title}</div>
                <div className="text-[13.5px] text-td-text-muted leading-relaxed mb-3.5">{f.desc}</div>
                <div className="font-mono-td text-[11px] text-td-text-dim px-2 py-1 bg-card border border-border rounded-[4px] inline-block">
                  {f.code}
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: '01', t: 'Paste a URL', d: 'YouTube, Vimeo, or any public video link.' },
  { n: '02', t: 'We fetch & transcribe', d: 'Transcripts are pulled or generated on the fly.' },
  { n: '03', t: 'AI structures it', d: 'TL;DR, chapters, key quotes, and timestamps.' },
  { n: '04', t: 'Shared with your team', d: 'Every summary lives in your workspace, searchable.' },
]

function HowItWorks() {
  return (
    <section className="py-[100px] px-8 border-b border-border">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="mb-[50px]">
          <Badge className="mb-3.5">How it works</Badge>
          <h2 className="text-[36px] tracking-[-0.025em] font-semibold max-w-[600px]">
            From video link to team-ready summary in under ten seconds.
          </h2>
        </Reveal>
        <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-[10px] overflow-hidden">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} className="py-7 px-6 bg-background">
              <div className="font-mono-td text-[11px] text-primary mb-[18px]">{s.n}</div>
              <div className="text-[17px] font-medium mb-1.5 tracking-[-0.01em]">{s.t}</div>
              <div className="text-[13px] text-td-text-muted leading-relaxed">{s.d}</div>
            </Reveal>
          ))}
        </div>

        {/* Animated stats row */}
        <Reveal
          className="mt-7 grid grid-cols-4 py-5 px-6 rounded-[10px] border border-border bg-card"
        >
          {[
            { v: <Counter to={4.2} decimals={1} suffix="s" />, l: 'Median time to summary' },
            { v: <Counter to={1200000} suffix="+" />, l: 'Videos summarized' },
            { v: <Counter to={98.4} decimals={1} suffix="%" />, l: 'Cache hit on shared queues' },
            { v: <Counter to={420} suffix=" teams" />, l: 'Workspaces on Pro' },
          ].map((s, i) => (
            <div key={i} className="px-4" style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div className="text-[26px] font-semibold tracking-[-0.02em]">{s.v}</div>
              <div className="text-[12px] text-td-text-muted mt-1">{s.l}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'For solo researchers kicking the tires.',
    cta: 'Get started',
    href: '/sign-up',
    featured: false,
    features: [
      '10 summaries / month',
      '1 workspace, 1 seat',
      'TL;DR + chapters',
      'Community support',
      'Shared summary cache',
    ],
  },
  {
    name: 'Pro',
    price: '$10',
    period: 'per user / month',
    desc: 'For teams that live in video calls and explainers.',
    cta: 'Start 14-day trial',
    href: '/sign-up',
    featured: true,
    features: [
      '500 summaries / user / month',
      '$0.04 per summary thereafter',
      'Unlimited workspaces & seats',
      'API access + Zapier',
      'Priority model routing',
      'SAML SSO & audit logs',
      'Slack & email support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual contract',
    desc: 'For orgs with compliance requirements.',
    cta: 'Talk to sales',
    href: '#',
    featured: false,
    features: [
      'Unlimited summaries',
      'Custom model routing',
      'On-prem transcript storage',
      'SOC 2 Type II, DPA, BAA',
      'Dedicated CSM',
      'Custom billing & terms',
    ],
  },
]

function PricingSection() {
  return (
    <section id="pricing" className="py-[100px] px-8 border-b border-border">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="text-center mb-14">
          <Badge className="mb-3.5">Pricing</Badge>
          <h2 className="text-[44px] tracking-[-0.03em] font-semibold mb-3.5">
            Priced like a utility, not a seat tax.
          </h2>
          <p className="text-[16px] text-td-text-muted">
            Pay for what you summarize. Every summary your team&apos;s ever run is cached across your org.
          </p>
        </Reveal>
        <div className="grid grid-cols-3 gap-3.5">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 90} className="td-pricing-card">
              <div
                className="rounded-xl p-7 relative"
                style={{
                  background: t.featured
                    ? 'linear-gradient(180deg, rgba(139,92,246,0.06), transparent 50%), var(--card)'
                    : 'var(--card)',
                  border: t.featured ? '1px solid var(--td-primary-border)' : '1px solid var(--border)',
                  boxShadow: t.featured ? '0 0 40px rgba(139,92,246,0.15)' : 'none',
                }}
              >
                {t.featured && (
                  <div className="absolute top-[-1px] right-5 bg-primary text-white text-[11px] font-medium px-2.5 py-1 rounded-b-[6px]">
                    Most popular
                  </div>
                )}
                <div className="text-[15px] font-medium mb-2">{t.name}</div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <div className="text-[44px] font-semibold tracking-[-0.03em]">{t.price}</div>
                  <div className="text-[13px] text-td-text-muted">{t.period}</div>
                </div>
                <div className="text-[13px] text-td-text-muted mb-5 min-h-10 leading-relaxed">{t.desc}</div>
                <div className={t.featured ? 'td-shimmer-host td-btn-anim' : 'td-btn-anim'}>
                  <Link
                    href={t.href}
                    className={cn(buttonVariants({ variant: t.featured ? 'default' : 'outline', size: 'lg' }), 'w-full justify-center')}
                  >
                    {t.cta}
                  </Link>
                </div>
                <div className="h-px bg-border my-[22px]" />
                <div className="flex flex-col gap-2.5">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-[13px]">
                      <Check size={14} className="text-primary shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-[100px] px-8 border-b border-border">
      <Reveal
        className="max-w-[920px] mx-auto rounded-2xl py-[60px] px-10 text-center border border-td-primary-border"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.25), transparent 60%), var(--card)',
        }}
      >
        <h2 className="text-[40px] tracking-[-0.03em] font-semibold mb-3.5">
          Stop re-watching. Start re-reading.
        </h2>
        <p className="text-[16px] text-td-text-muted max-w-[440px] mx-auto mb-7">
          10 free summaries. No credit card. Your team will thank you.
        </p>
        <div className="flex gap-2.5 justify-center">
          <div className="td-shimmer-host td-btn-anim">
            <Link href="/sign-up" className={cn(buttonVariants({ size: 'xl' }), 'gap-2')}>
              Start for free <ArrowRight size={14} />
            </Link>
          </div>
          <div className="td-btn-anim">
            <Link href="#" className={buttonVariants({ size: 'xl', variant: 'outline' })}>
              Book a demo
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="py-10 px-8 text-td-text-dim text-[12.5px]">
      <div className="max-w-[1120px] mx-auto flex justify-between items-center">
        <Logo size={18} />
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Security', 'Status'].map((l) => (
            <a key={l} href="#" className="hover:text-foreground transition-colors">
              {l}
            </a>
          ))}
        </div>
        <div className="font-mono-td">© 2026 TubeDigest, Inc.</div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-full">
      <LandingNav />
      <HeroA />
      <LogoStrip />
      <FeatureGrid />
      <HowItWorks />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  )
}
