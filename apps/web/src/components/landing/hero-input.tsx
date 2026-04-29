'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroInput() {
  const [url, setUrl] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = url.trim()
      ? `/sign-up?url=${encodeURIComponent(url.trim())}`
      : '/sign-up'
    router.push(target)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center h-[52px] bg-card border border-border rounded-[10px] px-4 gap-3">
        <Link2 size={15} className="text-td-text-dim shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 text-[14px] font-mono-td bg-transparent text-td-text placeholder:text-td-text-muted outline-none truncate"
        />
        <Button type="submit" size="md" className="gap-1.5 shrink-0">
          Summarize <Sparkles size={14} />
        </Button>
      </div>
    </form>
  )
}
