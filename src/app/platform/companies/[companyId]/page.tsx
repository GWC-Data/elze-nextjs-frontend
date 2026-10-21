'use client'

import View from '@/views/platform/CompanyDetailPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="companies/:companyId" home="/platform" permission={"company.read"}>
      <View />
    </RouteView>
  )
}
