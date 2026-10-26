import { useId } from 'react'
import { fetchAssignableRoles } from '@/api/platform.api'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/labels'
import { useAsync } from '@/hooks/useAsync'
import { usePaths } from '@/hooks/usePaths'
import type { RoleName } from '@/types/auth'

export type RoleScope = 'company' | 'platform' | 'any'

const COMPANY_ROLES: RoleName[] = ['COMPANY_ADMIN', 'USER']

function useAssignableRoles(scope: RoleScope, companyId: string | null | undefined): RoleName[] {
  const { shell } = usePaths()
  const wantsPlatform = scope !== 'company'
  const wantsCompany = scope !== 'platform'

  const assignable = useAsync(async () => {
    if (shell !== 'platform') return COMPANY_ROLES
    const [platformRoles, companyRoles] = await Promise.all([
      wantsPlatform ? fetchAssignableRoles() : null,
      wantsCompany && companyId ? fetchAssignableRoles(companyId) : null,
    ])
    return [
      ...(platformRoles?.roles.map((r) => r.role) ?? []),
      ...(wantsCompany ? (companyRoles?.roles.map((r) => r.role) ?? COMPANY_ROLES) : []),
    ]
  }, [shell, scope, companyId ?? null])

  return assignable.data ?? (wantsCompany ? COMPANY_ROLES : [])
}

export function RoleSelect({
  value,
  onChange,
  scope,
  companyId,
  disabled,
  label = 'Role',
}: {
  value: RoleName
  onChange: (role: RoleName) => void
  scope: RoleScope
  companyId?: string | null
  disabled?: boolean
  label?: string
}) {
  const id = useId()
  const assignable = useAssignableRoles(scope, companyId)
  const options = assignable.includes(value) ? assignable : [value, ...assignable]

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={(next) => onChange(next as RoleName)} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((role) => (
            <SelectItem key={role} value={role} disabled={!assignable.includes(role)}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[value]}</p>
    </div>
  )
}
