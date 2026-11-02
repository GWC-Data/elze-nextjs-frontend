import { cn } from '@/lib/utils'
import type { ActivityItem } from '@/types/playbooks'

export interface FeedItem extends ActivityItem {
  playbook?: string
}

export function ActivityFeed({ items, empty }: { items: FeedItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ol className="space-y-4 border-l pl-4">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              'absolute top-1.5 -left-[20.5px] size-2 rounded-full ring-4 ring-card',
              item.tone === 'success' ? 'bg-success' : 'bg-info'
            )}
            aria-hidden
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {item.time}
            {item.playbook ? ` · ${item.playbook}` : ''}
          </p>
          <p className="mt-0.5 text-sm text-foreground">{item.text}</p>
        </li>
      ))}
    </ol>
  )
}
