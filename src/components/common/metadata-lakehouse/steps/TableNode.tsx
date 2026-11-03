import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { KeyRound, Link2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCount } from '@/lib/format'
import type { DetectedTable } from '@/types/metadataLakehouse'
import { columnHandle } from '@/lib/graphLayout'
import { Hint } from '@/components/common/Hint'

const MAX_VISIBLE_COLUMNS = 8

export type TableNodeData = {
  table: DetectedTable
  highlighted: boolean
  linked: string[]
  activeColumns: string[]
}

const handleClass = '!size-2 !border-2 !border-primary/60 !bg-background'

function TableNodeImpl({ data, selected }: NodeProps) {
  const { table, highlighted, linked, activeColumns } = data as TableNodeData
  const linkedSet = new Set(linked)
  const activeSet = new Set(activeColumns)
  const ordered = [
    ...table.columns.filter((c) => linkedSet.has(c.name)),
    ...table.columns.filter((c) => !linkedSet.has(c.name) && c.keyCandidate),
    ...table.columns.filter((c) => !linkedSet.has(c.name) && !c.keyCandidate),
  ]
  const cap = Math.max(MAX_VISIBLE_COLUMNS, linked.length)
  const visible = ordered.slice(0, cap)
  const overflow = ordered.length - visible.length

  return (
    <div
      className={cn(
        'w-60 rounded-lg border bg-card shadow-sm transition-all',
        selected && 'ring-2 ring-primary',
        highlighted && !selected && 'ring-2 ring-primary/50',
        !selected && !highlighted && 'opacity-95'
      )}
    >
      <Handle type="target" position={Position.Left} id="table:target" className={handleClass} />
      <Handle type="source" position={Position.Right} id="table:source" className={handleClass} />

      <header className="flex items-center gap-1.5 rounded-t-lg border-b bg-muted/60 px-2.5 py-1.5">
        <Hint label={table.name}>
          <p className="min-w-0 flex-1 truncate text-xs font-semibold">{table.name}</p>
        </Hint>
        {table.rowCount !== null ? (
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {formatCount(table.rowCount)} rows
          </span>
        ) : null}
      </header>

      <ul className="divide-y text-[11px]">
        {visible.map((column) => {
          const isLinked = linkedSet.has(column.name)
          return (
            <li
              key={column.name}
              className={cn(
                'relative flex items-center gap-1.5 px-2.5 py-1',
                isLinked && 'bg-primary/5',
                activeSet.has(column.name) && 'bg-primary/15 font-semibold'
              )}
            >
              {isLinked ? (
                <>
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={columnHandle(column.name, 'target')}
                    className={handleClass}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={columnHandle(column.name, 'source')}
                    className={handleClass}
                  />
                </>
              ) : null}
              {column.keyCandidate ? (
                <Hint label="Possible key">
                  <KeyRound className="size-3 shrink-0 text-amber-600" aria-label="Possible key" />
                </Hint>
              ) : isLinked ? (
                <Link2 className="size-3 shrink-0 text-primary" aria-label="Joined column" />
              ) : (
                <span className="size-3 shrink-0" aria-hidden />
              )}
              <Hint label={column.name}>
                <span className="min-w-0 flex-1 truncate font-mono">{column.name}</span>
              </Hint>
              {column.sensitive ? (
                <Hint label="The name looks sensitive. Values are never shown.">
                  <ShieldAlert className="size-3 shrink-0 text-amber-600" aria-label="Sensitive column name" />
                </Hint>
              ) : null}
              {column.dataType ? (
                <span className="shrink-0 truncate text-[9px] uppercase text-muted-foreground">
                  {column.dataType}
                </span>
              ) : null}
            </li>
          )
        })}
        {overflow > 0 ? (
          <li className="px-2.5 py-1 text-[11px] italic text-muted-foreground">+{overflow} more</li>
        ) : null}
        {table.columns.length === 0 ? (
          <li className="px-2.5 py-1 text-[11px] italic text-muted-foreground">No columns reported</li>
        ) : null}
      </ul>
    </div>
  )
}

export const TableNode = memo(TableNodeImpl)
