'use client'

import View from '@/views/platform/RolesPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="roles" home="/platform" permission={"role.read"}>
      <View />
    </RouteView>
  )
}
