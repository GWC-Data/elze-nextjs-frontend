'use client'

import View from '@/views/metadata-lakehouse/MetadataLakehouseBuilderPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="metadata-lakehouse/builder" home="/platform" permission={"context.read"}>
      <View />
    </RouteView>
  )
}
