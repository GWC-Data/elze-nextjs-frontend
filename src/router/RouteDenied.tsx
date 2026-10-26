'use client'

import { Page } from '@/components/common/Page'
import { PermissionDeniedState } from '@/components/common/States'

export function RouteDenied({ detail, backTo }: { detail: string; backTo: string }) {
  return (
    <Page>
      <PermissionDeniedState detail={detail} backTo={backTo} />
    </Page>
  )
}
