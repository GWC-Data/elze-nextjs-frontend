import { initials, personTone } from '@/components/common/metadata-lakehouse/ContextCardParts'
import { cn } from '@/lib/utils'

export function GroupAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-xl font-semibold',
        size === 'sm' && 'size-8 text-[11px]',
        size === 'md' && 'size-9 text-xs',
        size === 'lg' && 'size-12 text-sm',
        personTone(name)
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function GroupStatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        active
          ? 'border-success/25 bg-success/10 text-success'
          : 'border-warning/30 bg-warning/15 text-warning-foreground'
      )}
    >
      <span className={cn('size-1.5 rounded-full', active ? 'bg-success' : 'bg-warning')} aria-hidden />
      {active ? 'Active' : 'Paused'}
    </span>
  )
}

export function memberLabel(count: number): string {
  return `${count} ${count === 1 ? 'member' : 'members'}`
}
