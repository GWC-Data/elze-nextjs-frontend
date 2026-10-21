'use client'

import View from '@/views/workspace/CompanySettingsPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/settings/company" home="/workspace" permission={"company.read"}>
      <View />
    </RouteView>
  )
}
