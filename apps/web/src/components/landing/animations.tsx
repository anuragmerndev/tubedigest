'use client'

import { useRef, useEffect, useState, useSyncExternalStore } from 'react'

export function useReveal({ delay = 0 } = {}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('td-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (delay) setTimeout(() => el.classList.add('td-in'), delay)
            else el.classList.add('td-in')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return ref
}

export function Reveal({
  delay = 0,
  className = '',
  style,
  children,
}: {
  delay?: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const ref = useReveal({ delay })
  return (
    <div
      ref={ref}
      className={`td-reveal ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </div>
  )
}

export function Counter({
  to,
  suffix = '',
  prefix = '',
  duration = 1400,
  decimals = 0,
}: {
  to: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const skipsAnimation = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    () => false,
  )
  useEffect(() => {
    const el = ref.current
    if (!el || skipsAnimation) return
    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true
            const t0 = performance.now()
            const tick = (t: number) => {
              const k = Math.min(1, (t - t0) / duration)
              const eased = 1 - Math.pow(1 - k, 3)
              setVal(to * eased)
              if (k < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration, skipsAnimation])

  const displayVal = skipsAnimation ? to : val
  const formatted =
    decimals > 0 ? displayVal.toFixed(decimals) : Math.round(displayVal).toLocaleString()
  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
