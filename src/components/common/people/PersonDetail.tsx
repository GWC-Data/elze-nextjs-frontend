import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@/lib/router'
import { Info, Loader2, Mail, UserCheck, UserX } from 'lucide-react'
import {
  fetchScopeOptions,
  fetchUserGrants,
  fetchUserScope,
  grantUserAccess,
  listAccessLevels,
  listGrantableDashboards,
  revokeUserAccess,
  saveUserScope,
} from '@/api/workspace.api'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/authContext'
import { usePaths } from '@/hooks/usePaths'
import { PageHeader, Section } from '@/components/common/Page'
import type { Crumb } from '@/components/common/Page'
import { AccessLevelBadge, RoleBadge, StatusBadge } from '@/components/common/Badges'
import { GrantActionsMenu } from '@/components/common/GrantActionsMenu'
import { ACCESS_LEVEL_LABELS } from '@/constants/labels'
import { SHOW_ANALYTICS } from '@/constants/sections'
import { ChipSelect } from '@/components/common/ChipSelect'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { RoleSelect } from '@/components/common/RoleSelect'
import { CompanyRoleSelect } from '@/components/common/roles/CompanyRoleSelect'
import { PermissionGrid } from '@/components/common/roles/PermissionGrid'
import { GrantPicker } from '@/components/common/people/GrantPicker'
import { PersonAvatar } from '@/components/common/metadata-lakehouse/ContextCardParts'
import { EmptyState, ErrorState, InlineLoading } from '@/components/common/States'
import { notify } from '@/lib/notify'
import { ADMIN_OUT_OF_REACH, adminOutOfReach } from '@/lib/peopleAccess'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AccessLevel, RoleName } from '@/types/auth'
import type { AdminUser, UserPermissions } from '@/types/admin'

export interface PersonActions {
  updateRole: (role: RoleName, customRoleId?: string | null) => Promise<unknown>
  loadPermissions: () => Promise<UserPermissions>
  savePermissions: (permissionIds: string[]) => Promise<UserPermissions>
  activate: () => Promise<unknown>
  deactivate: () => Promise<unknown>
  resendInvitation: () => Promise<unknown>
}

function personName(person: Pick<AdminUser, 'displayName' | 'username'>): string {
  return person.displayName || person.username
}

function permissionsLabel(person: AdminUser): string | null {
  if (person.companyId === null || person.role !== 'USER') return null
  return person.customRoleName || 'Standard'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoment(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? 'Never'
    : date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id))
}

function Card({ title, children, flush = false }: { title?: string; children: ReactNode; flush?: boolean }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      {title ? <h2 className="border-b px-5 py-3 text-sm font-semibold">{title}</h2> : null}
      <div className={flush ? undefined : 'p-5'}>{children}</div>
    </section>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-2.5 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <Info className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function SaveBar({ pending, onDiscard, onSave }: { pending: boolean; onDiscard: () => void; onSave: () => void }) {
  return (
    <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-sm font-medium">You have unsaved changes</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onDiscard} disabled={pending}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Save changes
        </Button>
      </div>
    </div>
  )
}

export function PersonDetail({
  person,
  actions,
  onChanged,
  crumbs,
  showCompany = false,
}: {
  person: AdminUser
  actions: PersonActions
  onChanged: () => void
  crumbs: Crumb[]
  showCompany?: boolean
}) {
  const { can, user: me } = useAuth()
  const paths = usePaths()
  const isSelf = person.id === me?.id
  const outOfReach = !isSelf && adminOutOfReach(me, person)
  const manageable = !isSelf && !outOfReach
  const name = personName(person)
  const permissions = permissionsLabel(person)

  const [confirming, setConfirming] = useState<'deactivate' | 'reissue' | null>(null)
  const [pending, setPending] = useState(false)

  const run = async (work: () => Promise<unknown>, success: string, detail?: string) => {
    setPending(true)
    try {
      await work()
      notify.success(success, detail)
      onChanged()
      setConfirming(null)
    } catch (err) {
      notify.failure('complete that change', err)
    } finally {
      setPending(false)
    }
  }

  const canReissue = can('user.update') && person.status !== 'disabled' && !outOfReach
  const canDeactivate = person.status !== 'disabled' && can('user.deactivate') && manageable
  const canReactivate = person.status === 'disabled' && can('user.activate') && !outOfReach
  const showScope = can('scope.read')
  const showDashboards = SHOW_ANALYTICS && can('access.read')

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={name}
        actions={
          canReissue || canDeactivate || canReactivate ? (
            <>
              {canReissue ? (
                <Button variant="outline" disabled={pending} onClick={() => setConfirming('reissue')}>
                  <Mail aria-hidden />
                  {person.status === 'pending' ? 'Resend invitation' : 'Reset access'}
                </Button>
              ) : null}
              {canReactivate ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => void run(() => actions.activate(), `${name} can sign in again.`)}
                >
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserCheck aria-hidden />}
                  Reactivate
                </Button>
              ) : null}
              {canDeactivate ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirming('deactivate')}
                >
                  <UserX aria-hidden />
                  Deactivate
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />

      {isSelf ? (
        <Notice>
          This is your own account. Change it from{' '}
          <Link to={paths.profile} className="font-medium text-foreground underline-offset-4 hover:underline">
            Your account
          </Link>
          .
        </Notice>
      ) : outOfReach ? (
        <Notice>{ADMIN_OUT_OF_REACH}</Notice>
      ) : !can('user.update') ? (
        <Notice>You can see this account but not change it.</Notice>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="role">Role &amp; permissions</TabsTrigger>
          {showScope ? <TabsTrigger value="data">Data access</TabsTrigger> : null}
          {showDashboards ? <TabsTrigger value="dashboards">Dashboards</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab person={person} permissions={permissions} showCompany={showCompany} />
        </TabsContent>

        <TabsContent value="role" className="mt-4">
          <RoleTab
            key={`${person.id}:${person.role}:${person.roleId ?? ''}`}
            person={person}
            actions={actions}
            editable={can('user.update') && manageable}
            onChanged={onChanged}
          />
        </TabsContent>

        {showScope ? (
          <TabsContent value="data" className="mt-4">
            <ScopeTab userId={person.id} />
          </TabsContent>
        ) : null}

        {showDashboards ? (
          <TabsContent value="dashboards" className="mt-4">
            <AccessSection person={person} />
          </TabsContent>
        ) : null}
      </Tabs>

      <ConfirmDialog
        open={confirming === 'deactivate'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Deactivate ${name}?`}
        body="They will be signed out and refused at sign-in."
        consequence="Their sessions end immediately. Nothing is deleted, and you can reactivate them later."
        confirmLabel="Deactivate"
        destructive
        pending={pending}
        onConfirm={() =>
          void run(() => actions.deactivate(), `${name} has been deactivated.`, 'They were signed out of every session.')
        }
      />

      <ConfirmDialog
        open={confirming === 'reissue'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={person.status === 'pending' ? 'Send a new invitation?' : `Reset access for ${name}?`}
        body={`A single-use activation link will be emailed to ${person.email}.`}
        consequence={
          person.status === 'pending'
            ? 'Any earlier link stops working.'
            : 'Their current password stops working immediately and their sessions end. They cannot sign in until they use the new link.'
        }
        confirmLabel="Send link"
        destructive={person.status !== 'pending'}
        pending={pending}
        onConfirm={() =>
          void run(() => actions.resendInvitation(), `A link was sent to ${person.email}.`, 'It can be used once, and expires.')
        }
      />
    </>
  )
}

function OverviewTab({
  person,
  permissions,
  showCompany,
}: {
  person: AdminUser
  permissions: string | null
  showCompany: boolean
}) {
  const name = personName(person)
  const left: { label: string; value: ReactNode }[] = [
    { label: 'Username', value: person.username },
    { label: 'Display name', value: person.displayName || '—' },
    ...(showCompany ? [{ label: 'Company', value: person.companyName ?? 'Platform account' }] : []),
    { label: 'Added', value: formatDate(person.createdAt) },
  ]
  const right: { label: string; value: ReactNode }[] = [
    { label: 'Account type', value: <RoleBadge role={person.role} defaultAdmin={person.isDefaultAdmin} /> },
    { label: 'Permissions', value: permissions ?? '—' },
    { label: 'Last signed in', value: formatMoment(person.lastLoginAt) },
  ]

  const column = (rows: typeof left) => (
    <dl className="divide-y">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 px-5 py-3">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 truncate text-sm font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  )

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <PersonAvatar name={name} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{person.email}</p>
        </div>
        <StatusBadge status={person.status} />
      </div>
      <div className="grid sm:grid-cols-2 sm:divide-x">
        {column(left)}
        <div className="border-t sm:border-t-0">{column(right)}</div>
      </div>
    </section>
  )
}

function RoleTab({
  person,
  actions,
  editable,
  onChanged,
}: {
  person: AdminUser
  actions: PersonActions
  editable: boolean
  onChanged: () => void
}) {
  const companyMember = person.companyId !== null
  const permissions = useAsync(
    () => (companyMember && person.role === 'USER' ? actions.loadPermissions() : Promise.resolve(null)),
    [person.id, person.role, person.roleId ?? null]
  )

  const savedCustom = person.customRoleId ?? null
  const [role, setRole] = useState<RoleName>(person.role)
  const [customRoleId, setCustomRoleId] = useState<string | null>(savedCustom)
  const [extra, setExtra] = useState<Set<string> | null>(null)
  const [saving, setSaving] = useState(false)

  const data: UserPermissions | null | undefined = permissions.data
  const fromRole = new Set<string>(data?.rolePermissionIds ?? [])
  const savedExtra = new Set<string>(data?.extraPermissionIds ?? [])
  const selectedExtra = extra ?? savedExtra
  const options = (data?.options ?? []).filter((option) => !fromRole.has(option.id))

  const roleChanged = role !== person.role || (role === 'USER' && customRoleId !== savedCustom)
  const extraChanged = extra !== null && !sameSet(extra, savedExtra)
  const dirty = roleChanged || extraChanged
  const showExtra = companyMember && person.role === 'USER' && role === 'USER'

  const discard = () => {
    setRole(person.role)
    setCustomRoleId(savedCustom)
    setExtra(null)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (roleChanged) await actions.updateRole(role, role === 'USER' ? customRoleId : undefined)
      if (extraChanged && role === 'USER') await actions.savePermissions([...selectedExtra])
      notify.success(
        'Changes saved.',
        role !== person.role ? 'Their sessions were ended, so the new account type applies immediately.' : undefined
      )
      setExtra(null)
      onChanged()
      permissions.reload()
    } catch (err) {
      notify.failure('save these changes', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Role">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          <RoleSelect
            label="Account type"
            value={role}
            onChange={setRole}
            scope={companyMember ? 'company' : 'platform'}
            companyId={person.companyId}
            disabled={!editable || saving}
            inline
          />
          {companyMember && role === 'USER' ? (
            <CompanyRoleSelect
              label="Permissions"
              builtInLabel="Standard"
              companyId={person.companyId}
              value={customRoleId}
              onChange={setCustomRoleId}
              disabled={!editable || saving}
              inline
            />
          ) : null}
        </div>
      </Card>

      {showExtra ? (
        <Card title="Extra permissions">
          {permissions.error ? (
            <ErrorState error={permissions.error} onRetry={permissions.reload} compact />
          ) : !data ? (
            <InlineLoading label="Loading permissions…" />
          ) : options.length ? (
            <PermissionGrid
              options={options}
              selected={selectedExtra}
              onChange={setExtra}
              readOnly={!editable || !data.editable || saving}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Their role already includes everything that could be added.</p>
          )}
        </Card>
      ) : null}

      {editable && dirty ? <SaveBar pending={saving} onDiscard={discard} onSave={() => void save()} /> : null}
    </div>
  )
}

function ScopeTab({ userId }: { userId: string }) {
  const { can } = useAuth()
  const editable = can('scope.update')

  const options = useAsync(() => fetchScopeOptions(), [])
  const current = useAsync(() => fetchUserScope(userId), [userId])

  const [edited, setEdited] = useState<Record<string, string[]> | null>(null)
  const [pending, setPending] = useState(false)

  const selected = edited ?? current.data?.scopes ?? {}
  const dimensions = options.data?.dimensions ?? []
  const enforced = options.data?.enforced ?? false

  const toggle = (dimension: string, value: string) => {
    setEdited((previous) => {
      const base = previous ?? current.data?.scopes ?? {}
      const values = base[dimension] || []
      return {
        ...base,
        [dimension]: values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value],
      }
    })
  }

  const save = async () => {
    setPending(true)
    try {
      const payload: Record<string, string[]> = {}
      for (const dimension of dimensions) {
        payload[dimension.dimension] = selected[dimension.dimension] || []
      }
      await saveUserScope(userId, payload)
      setEdited(null)
      notify.success('Data access saved.')
      current.reload()
    } catch (err) {
      notify.failure('save the data access', err)
    } finally {
      setPending(false)
    }
  }

  const loading = options.loading || current.loading
  const error = options.error ?? current.error

  return (
    <div className="space-y-4">
      <Card title="Data access">
        {error ? (
          <ErrorState
            error={error}
            title="Unable to load data access"
            onRetry={() => {
              options.reload()
              current.reload()
            }}
            compact
          />
        ) : loading ? (
          <InlineLoading label="Loading data access…" />
        ) : dimensions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data dimensions are set up yet.</p>
        ) : (
          <div className="space-y-5">
            {!enforced ? (
              <p className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" aria-hidden />
                Saved, but not applied yet: row-level filtering is switched off.
              </p>
            ) : null}
            {dimensions.map((dimension) => (
              <div key={dimension.dimension}>
                <p className="mb-2 text-xs font-medium text-foreground">{dimension.label}</p>
                {dimension.error ? (
                  <p className="text-xs text-destructive" role="alert">
                    {dimension.error}
                  </p>
                ) : (
                  <ChipSelect
                    options={dimension.values}
                    selected={selected[dimension.dimension] || []}
                    onToggle={(value) => toggle(dimension.dimension, value)}
                    keyOf={(value) => value}
                    labelOf={(value) => value}
                    disabled={!editable || pending}
                    emptyMessage="No values found in the data."
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {editable && edited !== null ? (
        <SaveBar pending={pending} onDiscard={() => setEdited(null)} onSave={() => void save()} />
      ) : null}
    </div>
  )
}

function AccessSection({ person }: { person: AdminUser }) {
  const { can } = useAuth()
  const paths = usePaths()
  const mayGrant = can('access.grant')
  const mayRevoke = can('access.revoke')

  const grants = useAsync(() => fetchUserGrants(person.id), [person.id])
  const grantable = useAsync(
    () => (mayGrant ? listGrantableDashboards(person.companyId ?? undefined) : Promise.resolve([])),
    [mayGrant, person.companyId]
  )

  const [pending, setPending] = useState(false)

  const grant = async (dashboardId: string, level: AccessLevel) => {
    setPending(true)
    try {
      await grantUserAccess(dashboardId, person.id, level)
      notify.success('Access granted.')
      grants.reload()
    } catch (err) {
      notify.failure('grant that access', err)
      throw err
    } finally {
      setPending(false)
    }
  }

  const levels = useAsync(() => listAccessLevels(), [])
  const [pendingId, setPendingId] = useState<string | null>(null)

  const revoke = async (dashboardId: string, title: string) => {
    setPendingId(dashboardId)
    try {
      await revokeUserAccess(dashboardId, person.id)
      notify.success(`${person.username} can no longer open ${title}.`)
      grants.reload()
    } catch (err) {
      notify.failure('revoke that access', err)
    } finally {
      setPendingId(null)
    }
  }

  const changeLevel = async (dashboardId: string, title: string, level: AccessLevel) => {
    setPendingId(dashboardId)
    try {
      await grantUserAccess(dashboardId, person.id, level)
      notify.success(`${person.username} now ${ACCESS_LEVEL_LABELS[level].toLowerCase()} ${title}.`)
      grants.reload()
    } catch (err) {
      notify.failure('change that permission', err)
    } finally {
      setPendingId(null)
    }
  }

  const rows = grants.data ?? []

  return (
    <Section
      title="Dashboard access"
      description="Where a dashboard reaches this person twice, the stronger of the two applies."
      flush
    >
      {mayGrant && (
        <GrantPicker dashboards={grantable.data ?? []} disabled={pending} onGrant={grant} />
      )}

      {grants.error ? (
        <ErrorState error={grants.error} title="Unable to load access" onRetry={grants.reload} compact />
      ) : grants.loading ? (
        <InlineLoading label="Loading access…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No dashboards yet"
          body={
            mayGrant
              ? 'Give them a dashboard above, or add them to a group that already has one.'
              : 'Nothing has been shared with this person.'
          }
          compact
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Dashboard</TableHead>
                <TableHead className="w-40">They can</TableHead>
                <TableHead className="w-48">Through</TableHead>
                <TableHead className="w-28 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const title = row.dashboardTitle || row.dashboardId
                return (
                  <TableRow key={`${row.origin}-${row.dashboardId}-${row.groupId ?? 0}`}>
                    <TableCell className="font-medium text-foreground">{title}</TableCell>
                    <TableCell>
                      <AccessLevelBadge level={row.level} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.origin === 'direct' ? 'Given to them' : `Group: ${row.groupName}`}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.origin === 'direct' && (
                        <GrantActionsMenu
                          holderName={person.username}
                          level={row.level}
                          levels={levels.data ?? undefined}
                          mayChange={mayGrant}
                          mayRemove={mayRevoke}
                          pending={pendingId === row.dashboardId}
                          onChangeLevel={(level) => void changeLevel(row.dashboardId, title, level)}
                          onRemove={() => void revoke(row.dashboardId, title)}
                        />
                      )}
                      {row.origin === 'group' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={row.groupId ? paths.group(row.groupId) : paths.groups}>Open group</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Section>
  )
}
