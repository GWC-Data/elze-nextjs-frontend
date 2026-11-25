import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

export function McpCopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      notify.failure('copy to the clipboard', err)
    }
  }
  const Icon = copied ? Check : Copy
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void copy()}
      aria-label={label}
      className={cn('h-8 shrink-0 gap-1.5 text-xs', className)}
    >
      <Icon className={cn('size-3.5', copied && 'text-emerald-600')} aria-hidden />
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}
