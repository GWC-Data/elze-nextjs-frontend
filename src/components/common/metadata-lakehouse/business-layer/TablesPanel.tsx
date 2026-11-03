import { useState } from 'react'
import { Search, Table2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Hint } from '@/components/common/Hint'
import { cn } from '@/lib/utils'
import type { ProfileTableRef } from '@/types/metadataLakehouse'

export function TablesPanel({
  tables,
  activeTableId,
  onSelect,
}: {
  tables: ProfileTableRef[]
  activeTableId: string
  onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const visible = query ? tables.filter((t) => t.name.toLowerCase().includes(query)) : tables

  return (
    <aside className="flex min-w-0 flex-col rounded-xl border bg-card shadow-xs lg:sticky lg:top-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Tables</h3>
        <span className="grid h-6 min-w-6 place-items-center rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums">
          {tables.length}
        </span>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            aria-label="Search tables"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
      </div>
      <nav aria-label="Tables" className="max-h-72 overflow-y-auto px-3 pb-3 lg:max-h-[calc(100vh-300px)]">
        <ul className="space-y-0.5">
          {visible.map((table) => {
            const active = table.id === activeTableId
            return (
              <li key={table.id}>
                <Hint label={table.name} side="right">
                  <button
                    type="button"
                    onClick={() => onSelect(table.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-left text-[13px] transition-colors',
                      active
                        ? 'border-foreground bg-muted font-medium text-foreground'
                        : 'border-transparent text-foreground/80 hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Table2 className="size-4 shrink-0 text-foreground/70" aria-hidden />
                    <span className="truncate">{table.name}</span>
                  </button>
                </Hint>
              </li>
            )
          })}
        </ul>
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-xs italic text-muted-foreground">No tables match “{search}”</p>
        ) : null}
      </nav>
    </aside>
  )
}
