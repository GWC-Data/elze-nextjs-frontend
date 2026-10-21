'use client'

import View from '@/views/platform/CompaniesPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="companies" home="/platform" permission={"company.read"}>
      <View />
    </RouteView>
  )
}
