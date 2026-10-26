import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  extra,
  consequence,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  pending = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: ReactNode
  extra?: ReactNode
  consequence?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>

        {extra}

        {consequence && (
          <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{consequence}</span>
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            className={cn(
              destructive &&
                buttonVariants({ variant: 'destructive' })
            )}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? 'Working…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  consequence,
  confirmLabel = 'Delete',
  pending = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: ReactNode
  consequence?: ReactNode
  confirmLabel?: string
  pending?: boolean
  onConfirm: (permanent: boolean) => void
}) {
  const { can } = useAuth()
  const id = useId()
  const allowPermanent = can('delete.permanent')
  const [permanent, setPermanent] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setPermanent(false)
  }

  const forGood = allowPermanent && permanent

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      body={body}
      extra={
        allowPermanent ? (
          <div className="flex items-start gap-2.5 rounded-md border px-3 py-2.5">
            <Checkbox
              id={id}
              checked={permanent}
              onCheckedChange={(checked) => setPermanent(checked === true)}
              disabled={pending}
              className="mt-0.5"
            />
            <Label htmlFor={id} className="flex-col items-start gap-0.5 text-sm font-medium">
              Delete permanently
              <span className="text-xs font-normal text-muted-foreground">
                Remove it from the database for good instead of keeping it as deleted.
              </span>
            </Label>
          </div>
        ) : undefined
      }
      consequence={
        forGood
          ? 'A permanent delete is final. The record and everything stored with it are erased and cannot be restored by anyone.'
          : consequence
      }
      confirmLabel={forGood ? 'Delete permanently' : confirmLabel}
      destructive
      pending={pending}
      onConfirm={() => onConfirm(forGood)}
    />
  )
}
