import { cn } from '@/lib/utils'
import { diffLines } from '@/lib/playbookYaml'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function CompareChangesDialog({
  open,
  onClose,
  name,
  version,
  dirty,
  before,
  after,
}: {
  open: boolean
  onClose: () => void
  name: string
  version: string
  dirty: boolean
  before: string
  after: string
}) {
  const rows = open ? diffLines(before, after) : []
  const added = rows.filter((row) => row.type === 'add').length
  const removed = rows.filter((row) => row.type === 'remove').length
  const changed = added + removed > 0

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compare changes</DialogTitle>
          <DialogDescription>
            {name} · {dirty ? `Unsaved changes vs. ${version}` : `${version}, no unsaved changes`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto rounded-lg border font-mono text-xs leading-5">
          {changed ? (
            rows.map((row, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  row.type === 'add' && 'bg-success/10',
                  row.type === 'remove' && 'bg-destructive/10'
                )}
              >
                <span
                  className={cn(
                    'w-7 shrink-0 text-center select-none',
                    row.type === 'add' && 'text-success',
                    row.type === 'remove' && 'text-destructive'
                  )}
                >
                  {row.type === 'add' ? '+' : row.type === 'remove' ? '−' : ''}
                </span>
                <span className="pr-4 whitespace-pre text-foreground">{row.text || ' '}</span>
              </div>
            ))
          ) : (
            <p className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No differences</p>
          )}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {changed
              ? `${added} line${added === 1 ? '' : 's'} added, ${removed} line${removed === 1 ? '' : 's'} removed`
              : 'No differences'}
          </span>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
