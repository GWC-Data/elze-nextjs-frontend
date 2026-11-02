import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { tokenizeYamlLine } from '@/lib/playbookYaml'
import type { YamlTokenKind } from '@/lib/playbookYaml'

const TOKEN_CLASS: Record<YamlTokenKind, string> = {
  plain: '',
  dash: 'text-muted-foreground',
  key: 'text-sky-700 dark:text-sky-300',
  mark: 'text-muted-foreground',
  string: 'text-emerald-700 dark:text-emerald-400',
  number: 'text-amber-700 dark:text-amber-400',
  comment: 'italic text-muted-foreground',
}

const mentions = (line: string, words: string[]) => words.some((word) => word && line.includes(word))

export function YamlView({
  yaml,
  search,
  flash,
  removing,
  className,
}: {
  yaml: string
  search: string
  flash: string[]
  removing: string[]
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const query = search.trim().toLowerCase()
  const searching = query.length > 1

  useEffect(() => {
    if (flash.length === 0) return
    containerRef.current?.querySelector('[data-flash]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [flash])

  return (
    <div ref={containerRef} className={cn('overflow-auto py-2 font-mono text-xs leading-5', className)}>
      {yaml.split('\n').map((line, index) => {
        const match = searching && line.toLowerCase().includes(query)
        const flashing = mentions(line, flash)
        const dropping = mentions(line, removing)
        return (
          <div
            key={index}
            data-flash={flashing || undefined}
            className={cn(
              'flex transition-colors duration-500',
              searching && !match && 'opacity-30',
              match && 'bg-warning/15',
              flashing && 'bg-primary/10',
              dropping && 'bg-destructive/10 line-through opacity-60'
            )}
          >
            <span className="w-11 shrink-0 pr-3 text-right text-muted-foreground/70 tabular-nums select-none">{index + 1}</span>
            <span className="pr-4 whitespace-pre text-foreground">
              {line
                ? tokenizeYamlLine(line).map((token, tokenIndex) => (
                    <span key={tokenIndex} className={TOKEN_CLASS[token.kind]}>
                      {token.text}
                    </span>
                  ))
                : ' '}
            </span>
          </div>
        )
      })}
    </div>
  )
}
