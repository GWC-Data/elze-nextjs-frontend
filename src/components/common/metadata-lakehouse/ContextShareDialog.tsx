import { useState } from 'react'
import { Building2, Check, Crown, Loader2, Lock, Search, Share2, UsersRound, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState, InlineLoading } from '@/components/common/States'
import { PersonAvatar } from '@/components/common/metadata-lakehouse/ContextCardParts'
import { AccessMenu } from '@/components/common/metadata-lakehouse/AccessMenu'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { CONTEXT_ACCESS_LABELS, GENERAL_ACCESS_HINTS, GENERAL_ACCESS_LABELS } from '@/lib/contextAccess'
import {
  useContextSharing,
  useSetGeneralAccess,
  useShareableCompanies,
  useShareableGroups,
  useShareablePeople,
  useShareContext,
  useShareContextWithCompany,
  useShareContextWithGroup,
  useUnshareContext,
  useUnshareContextWithCompany,
  useUnshareContextWithGroup,
} from '@/hooks/useMetadataLakehouse'
import type {
  ContextAccessLevel,
  ContextShareCompany,
  ContextShareGroup,
  ContextSharePerson,
  GeneralAccess,
} from '@/types/metadataLakehouse'

type TargetKind = 'person' | 'group' | 'company'

interface Target {
  kind: TargetKind
  id: string
  name: string
  detail: string
}

interface Holder extends Target {
  level: ContextAccessLevel
  inactiveNote: string | null
}

const NOUNS: Record<TargetKind, [string, string]> = {
  person: ['person', 'people'],
  group: ['group', 'groups'],
  company: ['company', 'companies'],
}

const NOW_CAN: Record<ContextAccessLevel, [string, string]> = {
  view: ['can now view', 'can now view'],
  edit: ['can now edit', 'can now edit'],
  full: ['now has full access to', 'now have full access to'],
}

function sameTarget(a: Pick<Target, 'kind' | 'id'>, b: Pick<Target, 'kind' | 'id'>): boolean {
  return a.kind === b.kind && a.id === b.id
}

function listed(words: string[]): string {
  return words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

function sharedSummary(done: Target[], level: ContextAccessLevel): string {
  if (done.length === 1) return `${done[0].name} ${NOW_CAN[level][0]} this context.`
  const counts = (Object.keys(NOUNS) as TargetKind[])
    .map((kind) => [kind, done.filter((t) => t.kind === kind).length] as const)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => `${n} ${NOUNS[kind][n === 1 ? 0 : 1]}`)
  return `${listed(counts)} ${NOW_CAN[level][1]} this context.`
}

export function ContextShareDialog({
  connectionId,
  name,
  open,
  onOpenChange,
}: {
  connectionId: string | null
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <div className="flex items-center gap-3 pr-8">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Share2 className="size-5" aria-hidden />
            </span>
            <DialogTitle className="min-w-0 truncate text-lg">Share {name}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Choose who can open this context and what they can do with it.
          </DialogDescription>
        </DialogHeader>
        {open && connectionId ? <ShareBody connectionId={connectionId} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function personName(p: Pick<ContextSharePerson, 'displayName' | 'username'>): string {
  return p.displayName || p.username
}

function memberLabel(count: number): string {
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

function joined(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ')
}

function Avatar({ kind, name, className }: { kind: TargetKind; name: string; className?: string }) {
  if (kind === 'company') {
    return (
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-info/10 text-info', className)}>
        <Building2 className="size-4" aria-hidden />
      </span>
    )
  }
  if (kind === 'group') {
    return (
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-success/10 text-success', className)}>
        <UsersRound className="size-4" aria-hidden />
      </span>
    )
  }
  return <PersonAvatar name={name} className={className} />
}

function ShareBody({ connectionId, onDone }: { connectionId: string; onDone: () => void }) {
  const sharing = useContextSharing(connectionId)
  const canShare = Boolean(sharing.data?.you.canShare)
  const platform = sharing.data?.scope === 'platform'

  const people = useShareablePeople(connectionId, canShare)
  const groups = useShareableGroups(connectionId, canShare)
  const companies = useShareableCompanies(connectionId, canShare && platform)

  const share = useShareContext(connectionId)
  const unshare = useUnshareContext(connectionId)
  const shareGroup = useShareContextWithGroup(connectionId)
  const unshareGroup = useUnshareContextWithGroup(connectionId)
  const shareCompany = useShareContextWithCompany(connectionId)
  const unshareCompany = useUnshareContextWithCompany(connectionId)
  const general = useSetGeneralAccess(connectionId)

  const [targets, setTargets] = useState<Target[]>([])
  const [level, setLevel] = useState<ContextAccessLevel>('view')
  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  if (sharing.isError) {
    return (
      <div className="p-6">
        <ErrorState error={sharing.error} onRetry={() => sharing.refetch()} compact />
      </div>
    )
  }
  if (!sharing.data) {
    return (
      <div className="p-6">
        <InlineLoading label="Loading who has access…" />
      </div>
    )
  }

  const { owner, generalAccess, you } = sharing.data
  const holders: Holder[] = [
    ...(sharing.data.companies ?? []).map((c) => ({
      kind: 'company' as const,
      id: c.companyId,
      name: c.name,
      detail: memberLabel(c.memberCount),
      level: c.level,
      inactiveNote: c.active ? null : 'deactivated',
    })),
    ...(sharing.data.groups ?? []).map((g) => ({
      kind: 'group' as const,
      id: g.groupId,
      name: g.name,
      detail: joined(memberLabel(g.memberCount), platform ? g.companyName : null),
      level: g.level,
      inactiveNote: g.active ? null : 'paused',
    })),
    ...sharing.data.people.map((p) => ({
      kind: 'person' as const,
      id: p.userId,
      name: personName(p),
      detail: joined(p.email, platform ? p.companyName : null),
      level: p.level,
      inactiveNote: p.active ? null : 'deactivated',
    })),
  ]
  const held = new Set(holders.map((h) => `${h.kind}:${h.id}`))

  const options = {
    companies: (companies.data ?? [])
      .filter((c) => !held.has(`company:${c.companyId}`))
      .map((c: ContextShareCompany) => ({
        kind: 'company' as const,
        id: c.companyId,
        name: c.name,
        detail: memberLabel(c.memberCount),
      })),
    groups: (groups.data ?? [])
      .filter((g) => !held.has(`group:${g.groupId}`))
      .map((g: ContextShareGroup) => ({
        kind: 'group' as const,
        id: g.groupId,
        name: g.name,
        detail: joined(memberLabel(g.memberCount), platform ? g.companyName : null),
      })),
    people: (people.data ?? [])
      .filter((p) => !held.has(`person:${p.userId}`))
      .map((p: ContextSharePerson) => ({
        kind: 'person' as const,
        id: p.userId,
        name: personName(p),
        detail: joined(p.email, platform ? p.companyName : null),
      })),
  }
  const loadingOptions = people.isPending || groups.isPending || (platform && companies.isPending)

  const grant = (kind: TargetKind, id: string, next: ContextAccessLevel) => {
    if (kind === 'company') return shareCompany.mutateAsync({ companyId: id, level: next })
    if (kind === 'group') return shareGroup.mutateAsync({ groupId: id, level: next })
    return share.mutateAsync({ userId: id, level: next })
  }

  const revoke = (kind: TargetKind, id: string) => {
    if (kind === 'company') return unshareCompany.mutateAsync(id)
    if (kind === 'group') return unshareGroup.mutateAsync(id)
    return unshare.mutateAsync(id)
  }

  const toggleTarget = (picked: Target) =>
    setTargets((current) =>
      current.some((t) => sameTarget(t, picked)) ? current.filter((t) => !sameTarget(t, picked)) : [...current, picked]
    )

  const add = async () => {
    if (targets.length === 0) return
    setAdding(true)
    const done: Target[] = []
    const failed: Target[] = []
    let lastError: unknown = null
    for (const target of targets) {
      try {
        await grant(target.kind, target.id, level)
        done.push(target)
      } catch (err) {
        failed.push(target)
        lastError = err
      }
    }
    setTargets(failed)
    setAdding(false)
    if (done.length) {
      notify.success(
        sharedSummary(done, level),
        done.some((t) => t.kind !== 'person') ? 'Every active member of the groups and companies has it now.' : undefined
      )
    }
    if (failed.length) {
      notify.failure(`share with ${listed(failed.map((t) => t.name))}`, lastError)
    }
  }

  const change = async (holder: Holder, next: ContextAccessLevel) => {
    if (next === holder.level) return
    setPending(`${holder.kind}:${holder.id}`)
    try {
      await grant(holder.kind, holder.id, next)
      notify.success(`${holder.name} ${NOW_CAN[next][0]} this context.`)
    } catch (err) {
      notify.failure('change that access', err)
    } finally {
      setPending(null)
    }
  }

  const remove = async (holder: Holder) => {
    setPending(`${holder.kind}:${holder.id}`)
    try {
      await revoke(holder.kind, holder.id)
      notify.success(`${holder.name} can no longer open this context.`)
    } catch (err) {
      notify.failure('remove that access', err)
    } finally {
      setPending(null)
    }
  }

  const setGeneral = async (next: GeneralAccess) => {
    try {
      await general.mutateAsync(next)
      notify.success(`General access is now "${GENERAL_ACCESS_LABELS[next]}".`)
    } catch (err) {
      notify.failure('change general access', err)
    }
  }

  const ownerName = owner?.name ?? 'Its creator is no longer a user'
  const adminsNote = platform ? 'Platform accounts also have full access' : 'Company admins also have full access'

  return (
    <>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {canShare ? (
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-2 sm:flex-row sm:items-start">
            <AddPicker
              platform={platform}
              options={options}
              loading={loadingOptions}
              selected={targets}
              onToggle={toggleTarget}
              disabled={adding}
            />
            <div className="flex items-center gap-2 sm:pt-0.5">
              <AccessMenu value={level} onChange={setLevel} disabled={adding} label="Access to give" />
              <Button onClick={() => void add()} disabled={targets.length === 0 || adding} className="min-w-20">
                {adding ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {targets.length > 1 ? `Share with ${targets.length}` : 'Share'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden />
            {platform
              ? 'Only platform accounts can change who has access to this context.'
              : 'Only the person who created this context, or a company admin, can change who has access.'}
          </div>
        )}

        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Who has access</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {holders.length + 1}
            </span>
          </div>
          <ul className="divide-y overflow-hidden rounded-xl border">
            <li className="flex items-center gap-3 bg-muted/20 px-4 py-3">
              <Avatar kind="person" name={ownerName} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {ownerName}
                  {you.isOwner ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span> : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{adminsNote}</span>
              </span>
              <Badge variant="outline" className="shrink-0 gap-1 border-warning/30 bg-warning/10 font-medium text-warning-foreground">
                <Crown className="size-3" aria-hidden />
                Owner
              </Badge>
            </li>
            {holders.map((h) => {
              const key = `${h.kind}:${h.id}`
              return (
                <li key={key} className="flex items-center gap-3 px-4 py-3">
                  <Avatar kind={h.kind} name={h.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {h.name}
                      {h.inactiveNote ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">({h.inactiveNote})</span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{h.detail}</span>
                  </span>
                  {canShare ? (
                    <AccessMenu
                      value={h.level}
                      onChange={(next) => void change(h, next)}
                      onRemove={() => void remove(h)}
                      disabled={pending === key}
                      busy={pending === key}
                      label={`Access for ${h.name}`}
                      quiet
                    />
                  ) : (
                    <span className="shrink-0 text-sm text-muted-foreground">{CONTEXT_ACCESS_LABELS[h.level]}</span>
                  )}
                </li>
              )
            })}
          </ul>
          {holders.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Nobody else has been added yet.
            </p>
          ) : null}
        </section>

        {platform ? null : (
          <section>
            <h3 className="mb-2.5 text-sm font-semibold">General access</h3>
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full',
                  generalAccess === 'company' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                )}
              >
                {generalAccess === 'company' ? (
                  <Building2 className="size-4" aria-hidden />
                ) : (
                  <Lock className="size-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                {canShare ? (
                  <Select
                    value={generalAccess}
                    onValueChange={(v) => v !== generalAccess && void setGeneral(v as GeneralAccess)}
                    disabled={general.isPending}
                  >
                    <SelectTrigger
                      className="h-auto w-auto gap-1.5 border-0 p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                      aria-label="General access"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(GENERAL_ACCESS_LABELS) as GeneralAccess[]).map((g) => (
                        <SelectItem key={g} value={g}>
                          {GENERAL_ACCESS_LABELS[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{GENERAL_ACCESS_LABELS[generalAccess]}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">{GENERAL_ACCESS_HINTS[generalAccess]}</p>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-3">
        <p className="text-xs text-muted-foreground">Applies to the draft and every published version.</p>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </div>
    </>
  )
}

function AddPicker({
  platform,
  options,
  loading,
  selected,
  onToggle,
  disabled,
}: {
  platform: boolean
  options: { companies: Target[]; groups: Target[]; people: Target[] }
  loading: boolean
  selected: Target[]
  onToggle: (target: Target) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const placeholder = platform ? 'Add people, groups or companies…' : 'Add people or groups…'
  const nothingLeft = !loading && options.companies.length + options.groups.length + options.people.length === 0
  const isPicked = (item: Target) => selected.some((t) => sameTarget(t, item))

  const sections: { heading: string; items: Target[] }[] = [
    { heading: 'Companies', items: options.companies },
    { heading: 'Groups', items: options.groups },
    { heading: 'People', items: options.people },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg bg-background px-2 py-1.5">
          {selected.map((t) => (
            <span
              key={`${t.kind}:${t.id}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/60 py-0.5 pr-1 pl-0.5 text-xs font-medium"
            >
              <Avatar kind={t.kind} name={t.name} className="size-5 text-[9px] [&_svg]:size-3" />
              <span className="max-w-40 truncate">{t.name}</span>
              <button
                type="button"
                aria-label={`Remove ${t.name} from the selection`}
                disabled={disabled}
                onClick={() => onToggle(t)}
                className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-label={placeholder}
              disabled={disabled}
              className="flex h-7 min-w-36 flex-1 items-center gap-2 rounded-md px-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-muted-foreground">
                {loading
                  ? 'Loading…'
                  : nothingLeft && selected.length === 0
                    ? 'Everyone already has access'
                    : selected.length
                      ? 'Add more…'
                      : placeholder}
              </span>
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[var(--radix-popper-anchor-width)] min-w-72 p-0">
        <Command>
          <CommandInput placeholder="Search by name, email or company…" />
          <CommandList className="max-h-72">
            <CommandEmpty>{loading ? 'Loading…' : 'Nobody matches that.'}</CommandEmpty>
            {sections.map((section) =>
              section.items.length ? (
                <CommandGroup key={section.heading} heading={section.heading}>
                  {section.items.map((item) => {
                    const picked = isPicked(item)
                    return (
                      <CommandItem
                        key={`${item.kind}:${item.id}`}
                        value={`${item.kind} ${item.name} ${item.detail} ${item.id}`}
                        onSelect={() => onToggle(item)}
                        className="gap-2.5"
                        aria-selected={picked}
                      >
                        <Avatar kind={item.kind} name={item.name} className="size-7 text-[10px] [&_svg]:size-3.5" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{item.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                        </span>
                        <span
                          className={cn(
                            'grid size-4 shrink-0 place-items-center rounded border',
                            picked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                          )}
                          aria-hidden
                        >
                          {picked ? <Check className="size-3" /> : null}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null
            )}
          </CommandList>
          {selected.length ? (
            <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
              <span>{selected.length} selected</span>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
