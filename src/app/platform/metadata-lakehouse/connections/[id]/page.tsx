'use client'

import View from '@/views/metadata-lakehouse/ConnectionDatasetsPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="metadata-lakehouse/connections/:id" home="/platform" permission={"context.read"}>
      <View />
    </RouteView>
  )
}
