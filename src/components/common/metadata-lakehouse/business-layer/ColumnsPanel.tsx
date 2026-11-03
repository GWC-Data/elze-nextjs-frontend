import { useState } from 'react'
import { KeyRound, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Hint } from '@/components/common/Hint'
import type { ColumnProfile } from '@/types/metadataLakehouse'

export function ColumnsPanel({
  columns,
  loading,
  failed,
  onRetry,
}: {
  columns: ColumnProfile[]
  loading: boolean
  failed: boolean
  onRetry: () => void
}) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const visible = query ? columns.filter((c) => c.name.toLowerCase().includes(query)) : columns

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          Columns
          {loading || failed ? null : (
            <span className="grid h-5 min-w-5 place-items-center rounded-md bg-muted px-1.5 text-[11px] font-semibold tabular-nums">
              {columns.length}
            </span>
          )}
        </h4>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search columns..."
            aria-label="Search columns"
            disabled={loading || failed}
            className="h-9 pl-8 text-[13px]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,10rem)] gap-4 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Column name</span>
          <span>Data type</span>
        </div>
        <div className="h-72 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4" aria-busy="true">
              <span className="sr-only">Loading columns...</span>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : failed ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
              Couldn't load the columns of this table.
              <button
                type="button"
                onClick={onRetry}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="p-6 text-center text-xs italic text-muted-foreground">
              {columns.length === 0 ? 'This table has no columns.' : `No columns match “${search}”`}
            </p>
          ) : (
            <ul className="divide-y">
              {visible.map((column) => (
                <li
                  key={column.name}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,10rem)] items-center gap-4 px-4 py-2 text-[13px]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-foreground" title={column.name}>
                      {column.name}
                    </span>
                    {column.isPrimaryKey ? (
                      <Hint label="Primary key">
                        <KeyRound className="size-3.5 shrink-0 text-amber-600" aria-label="Primary key" />
                      </Hint>
                    ) : null}
                  </span>
                  <span className="truncate text-xs uppercase text-muted-foreground" title={column.dataType}>
                    {column.dataType}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
