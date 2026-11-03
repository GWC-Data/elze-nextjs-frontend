import { Table2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/common/metadata-lakehouse/business-layer/Field'
import { ColumnsPanel } from '@/components/common/metadata-lakehouse/business-layer/ColumnsPanel'
import { LIMITS } from '@/components/common/metadata-lakehouse/business-layer/businessLayerModel'
import type { ColumnProfile } from '@/types/metadataLakehouse'

export function DatasetOverviewSection({
  tableId,
  tableName,
  overview,
  onChange,
  columns,
  columnsLoading,
  columnsFailed,
  onRetryColumns,
  readOnly,
}: {
  tableId: string
  tableName: string
  overview: string
  onChange: (overview: string) => void
  columns: ColumnProfile[]
  columnsLoading: boolean
  columnsFailed: boolean
  onRetryColumns: () => void
  readOnly: boolean
}) {
  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs">
      <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-foreground">
        <Table2 className="size-4 shrink-0 text-foreground/70" aria-hidden />
        <span className="truncate" title={tableName}>
          {tableName}
        </span>
      </h3>

      <Field id="bl-dataset-overview" label="Dataset Overview" count={overview.length} max={LIMITS.tableOverview}>
        <Textarea
          id="bl-dataset-overview"
          value={overview}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what this table contains, what one row represents and how your team uses it."
          maxLength={LIMITS.tableOverview}
          disabled={readOnly}
          rows={5}
          className="min-h-28 resize-y text-[13px]"
        />
      </Field>

      <div className="border-t pt-5">
        <ColumnsPanel
          key={tableId}
          columns={columns}
          loading={columnsLoading}
          failed={columnsFailed}
          onRetry={onRetryColumns}
        />
      </div>
    </section>
  )
}
