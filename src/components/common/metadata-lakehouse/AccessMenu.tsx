import { Check, ChevronDown, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CONTEXT_ACCESS_HINTS, CONTEXT_ACCESS_LABELS, CONTEXT_ACCESS_ORDER } from '@/lib/contextAccess'
import { cn } from '@/lib/utils'
import type { ContextAccessLevel } from '@/types/metadataLakehouse'

export function AccessMenu({
  value,
  onChange,
  onRemove,
  disabled,
  busy = false,
  label,
  quiet = false,
}: {
  value: ContextAccessLevel
  onChange: (level: ContextAccessLevel) => void
  onRemove?: () => void
  disabled?: boolean
  busy?: boolean
  label: string
  quiet?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={quiet ? 'ghost' : 'outline'}
          size="sm"
          disabled={disabled}
          aria-label={label}
          className={cn('shrink-0 gap-1.5 font-normal', quiet ? 'text-muted-foreground' : 'bg-background')}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          {CONTEXT_ACCESS_LABELS[value]}
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {CONTEXT_ACCESS_ORDER.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => onChange(l)} className="items-start gap-2.5 py-2">
            <Check className={cn('mt-0.5 size-4 shrink-0', l === value ? 'opacity-100' : 'opacity-0')} aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{CONTEXT_ACCESS_LABELS[l]}</span>
              <span className="block text-xs text-muted-foreground">{CONTEXT_ACCESS_HINTS[l]}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove} className="gap-2.5">
              <Trash2 className="size-4" aria-hidden />
              Remove access
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
