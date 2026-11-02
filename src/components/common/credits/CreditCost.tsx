import { Coins } from 'lucide-react'
import { Hint } from '@/components/common/Hint'
import { useCreditCheck } from '@/hooks/useCredits'
import { creditLabel, formatCredits } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CreditAction } from '@/types/credits'

export function CreditCost({
  action,
  onPrimary = false,
  className,
}: {
  action: CreditAction
  onPrimary?: boolean
  className?: string
}) {
  const { cost, short, reason } = useCreditCheck(action)
  if (cost === null) return null

  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
        onPrimary ? 'opacity-80' : short ? 'text-destructive' : 'text-muted-foreground',
        className
      )}
      aria-label={creditLabel(cost)}
    >
      <Coins className="size-3" aria-hidden />
      {formatCredits(cost)}
    </span>
  )

  if (onPrimary) return chip
  return <Hint label={reason ?? `Costs ${creditLabel(cost)}`}>{chip}</Hint>
}
