import { connectorPresentation } from '@/lib/connectors'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: { box: 'size-9 rounded-lg', glyph: 'size-5', icon: 'size-4' },
  md: { box: 'size-11 rounded-xl', glyph: 'size-6', icon: 'size-5' },
  lg: { box: 'size-16 rounded-2xl', glyph: 'size-9', icon: 'size-8' },
} as const

export function ConnectorMark({
  provider,
  size = 'md',
  muted = false,
  className,
}: {
  provider: string
  size?: keyof typeof SIZES
  muted?: boolean
  className?: string
}) {
  const presentation = connectorPresentation(provider)
  const dimensions = SIZES[size]
  const frame = 'flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-black/5 ring-inset dark:ring-white/10'

  if (presentation.logo) {
    return (
      <span
        className={cn(
          frame,
          dimensions.box,
          !presentation.logoFills && 'bg-white',
          muted && 'opacity-60 grayscale',
          className
        )}
      >
        <img
          src={presentation.logo}
          alt=""
          aria-hidden
          draggable={false}
          className={presentation.logoFills ? 'size-full object-cover' : cn(dimensions.glyph, 'object-contain')}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        frame,
        dimensions.box,
        muted ? 'bg-muted text-muted-foreground/60' : presentation.accentClass,
        className
      )}
    >
      <presentation.icon className={dimensions.icon} aria-hidden />
    </span>
  )
}
