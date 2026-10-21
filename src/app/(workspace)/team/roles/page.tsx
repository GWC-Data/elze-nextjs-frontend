'use client'

import View from '@/views/workspace/CompanyRolesPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/team/roles" home="/workspace" permission={"role.read"}>
      <View />
    </RouteView>
  )
}
