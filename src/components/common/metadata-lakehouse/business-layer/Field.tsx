import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span
      className={cn(
        'self-end text-xs tabular-nums',
        value >= max ? 'font-medium text-destructive' : 'text-muted-foreground'
      )}
    >
      {value.toLocaleString()}/{max.toLocaleString()}
    </span>
  )
}

export function Field({
  id,
  label,
  count,
  max,
  className,
  children,
}: {
  id?: string
  label: string
  count?: number
  max?: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
      </Label>
      {children}
      {max !== undefined && count !== undefined ? <Counter value={count} max={max} /> : null}
    </div>
  )
}
