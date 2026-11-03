import { Paperclip, X } from 'lucide-react'
import { formatBytes } from '@/lib/format'

export function AttachedFiles({
  files,
  onRemove,
  disabled,
}: {
  files: File[]
  onRemove: (file: File) => void
  disabled?: boolean
}) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed bg-muted/20 px-3 py-2.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        Reference files for the AI ({files.length})
      </span>
      {files.map((file) => (
        <span
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className="inline-flex items-center gap-1 rounded-md border bg-card py-0.5 pr-1 pl-2 text-xs text-foreground"
        >
          <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className="max-w-56 truncate">{file.name}</span>
          <span className="text-muted-foreground">{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={() => onRemove(file)}
            disabled={disabled}
            aria-label={`Remove ${file.name}`}
            className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  )
}
