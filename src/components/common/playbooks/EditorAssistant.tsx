import { useEffect, useRef, useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EDITOR_SUGGESTIONS } from '@/lib/playbookAssistant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichText } from '@/components/common/playbooks/RichText'
import type { AssistantMessage } from '@/types/playbooks'

export function EditorAssistant({
  messages,
  typing,
  initials,
  onSend,
  className,
}: {
  messages: AssistantMessage[]
  typing: boolean
  initials: string
  onSend: (text: string) => void
  className?: string
}) {
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages.length, typing])

  const send = (text: string) => {
    const value = text.trim()
    if (!value || typing) return
    onSend(value)
    setInput('')
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div ref={logRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex gap-2', message.role === 'user' && 'flex-row-reverse')}>
            {message.role === 'assistant' ? (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-3.5" aria-hidden />
              </span>
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                {initials}
              </span>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                message.role === 'assistant' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
              )}
            >
              {message.role === 'assistant' ? <RichText text={message.text} /> : message.text}
            </div>
          </div>
        ))}
        {typing ? (
          <div className="flex gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-3.5" aria-hidden />
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-2.5" aria-label="Assistant is typing">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {EDITOR_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={typing}
            onClick={() => send(suggestion)}
            className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          send(input)
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tell me what to change…"
          aria-label="Message the playbook assistant"
          className="h-9"
        />
        <Button type="submit" size="icon-lg" disabled={!input.trim() || typing} aria-label="Send">
          <Send aria-hidden />
        </Button>
      </form>
    </div>
  )
}
