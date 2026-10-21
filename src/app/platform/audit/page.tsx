'use client'

import View from '@/views/AuditLogPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="audit" home="/platform">
      <View />
    </RouteView>
  )
}
