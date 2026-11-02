import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Minus, Plus } from 'lucide-react'
import { allocateCredits, setCreditLimit, updateCreditRate } from '@/api/credits.api'
import { Field, TextField } from '@/components/common/Fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { refreshCreditRates, refreshCreditStatus } from '@/hooks/useCredits'
import { creditLabel, formatCredits } from '@/lib/format'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import type { CompanyCredits, CreditMember, CreditRate } from '@/types/credits'

const MAX_CREDITS = 1_000_000

function parseCredits(text: string): number | null {
  const value = text.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null
  return Number(value)
}

function AmountField({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  disabled?: boolean
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        className="tabular-nums"
      />
    </Field>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T
  options: { value: NoInfer<T>; label: string; icon?: typeof Plus }[]
  onChange: (value: NoInfer<T>) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup">
      {options.map((option) => {
        const Icon = option.icon
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors',
              active ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="space-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium tabular-nums text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AllocateCreditsDialog({
  company,
  onClose,
  onDone,
}: {
  company: Pick<CompanyCredits, 'id' | 'name' | 'balance'>
  onClose: () => void
  onDone: (balance: number) => void
}) {
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)

  const parsed = parseCredits(amount)
  const tooMuch = parsed !== null && (parsed > MAX_CREDITS || (mode === 'remove' && parsed > company.balance))
  const error =
    amount.trim() === ''
      ? null
      : parsed === null || parsed === 0
        ? 'Enter a positive amount with up to two decimals.'
        : tooMuch
          ? mode === 'remove'
            ? `Only ${creditLabel(company.balance)} can be taken back.`
            : `At most ${formatCredits(MAX_CREDITS)} at a time.`
          : null
  const ready = parsed !== null && parsed > 0 && !error
  const delta = ready ? (mode === 'add' ? parsed : -parsed) : 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready || pending || parsed === null) return
    setPending(true)
    try {
      const result = await allocateCredits(company.id, { credits: delta, note: note.trim() || null })
      notify.success(
        mode === 'add' ? `${creditLabel(parsed)} added to ${company.name}.` : `${creditLabel(parsed)} taken back.`,
        `Balance is now ${creditLabel(result.balance)}.`
      )
      onDone(result.balance)
    } catch (err) {
      notify.failure(mode === 'add' ? 'add credits' : 'take credits back', err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Credits for {company.name}</DialogTitle>
          <DialogDescription>Current balance {creditLabel(company.balance)}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Segmented
            value={mode}
            onChange={setMode}
            disabled={pending}
            options={[
              { value: 'add', label: 'Add', icon: Plus },
              { value: 'remove', label: 'Take back', icon: Minus },
            ]}
          />
          <AmountField label="Credits" value={amount} onChange={setAmount} error={error} disabled={pending} autoFocus />
          <TextField label="Note" value={note} onChange={setNote} placeholder="Annual plan, top-up…" disabled={pending} />
          <Summary
            rows={[
              ['Current balance', formatCredits(company.balance)],
              ['New balance', formatCredits(Math.round((company.balance + delta) * 100) / 100)],
            ]}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {mode === 'add' ? 'Add credits' : 'Take back'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreditLimitDialog({
  member,
  onClose,
  onDone,
}: {
  member: CreditMember
  onClose: () => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<'none' | 'limit'>(member.limit === null ? 'none' : 'limit')
  const [amount, setAmount] = useState(member.limit === null ? '' : String(member.limit))
  const [pending, setPending] = useState(false)

  const parsed = parseCredits(amount)
  const error =
    mode === 'none' || amount.trim() === ''
      ? null
      : parsed === null
        ? 'Enter an amount with up to two decimals.'
        : parsed > MAX_CREDITS
          ? `At most ${formatCredits(MAX_CREDITS)}.`
          : null
  const ready = mode === 'none' || (parsed !== null && !error)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready || pending) return
    setPending(true)
    try {
      const limit = mode === 'none' ? null : parsed
      await setCreditLimit(member.id, limit)
      notify.success(
        limit === null ? `${member.name} is unrestricted.` : `${member.name} is restricted to ${creditLabel(limit)}.`
      )
      void refreshCreditStatus()
      onDone()
    } catch (err) {
      notify.failure('save the restriction', err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restrict credits</DialogTitle>
          <DialogDescription>
            {member.name} · {member.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Segmented
            value={mode}
            onChange={setMode}
            disabled={pending}
            options={[
              { value: 'none', label: 'Unrestricted' },
              { value: 'limit', label: 'Restrict' },
            ]}
          />
          {mode === 'limit' && (
            <AmountField
              label="Credit limit"
              value={amount}
              onChange={setAmount}
              error={error}
              hint="Counts what they have already used. It stays until you change it."
              disabled={pending}
              autoFocus
            />
          )}
          <Summary
            rows={[
              ['Used so far', formatCredits(member.used)],
              [
                'Left',
                mode === 'none'
                  ? 'Whole company balance'
                  : parsed === null
                    ? '—'
                    : formatCredits(Math.max(0, Math.round((parsed - member.used) * 100) / 100)),
              ],
            ]}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreditRateDialog({
  rate,
  onClose,
  onDone,
}: {
  rate: CreditRate
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState(String(rate.credits))
  const [pending, setPending] = useState(false)

  const parsed = parseCredits(amount)
  const error =
    amount.trim() === ''
      ? null
      : parsed === null
        ? 'Enter an amount with up to two decimals.'
        : parsed > 1000
          ? 'At most 1,000 credits.'
          : null
  const ready = parsed !== null && !error && parsed !== rate.credits

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready || pending || parsed === null) return
    setPending(true)
    try {
      await updateCreditRate(rate.action, parsed)
      notify.success(`${rate.label} now costs ${creditLabel(parsed)}.`, 'Past charges keep their price.')
      void refreshCreditRates()
      onDone()
    } catch (err) {
      notify.failure('change the price', err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{rate.label}</DialogTitle>
          {rate.description && <DialogDescription>{rate.description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AmountField label="Credits" value={amount} onChange={setAmount} error={error} disabled={pending} autoFocus />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Save price
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
