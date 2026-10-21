'use client'

import View from '@/views/metadata-lakehouse/MetadataLakehousePage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="metadata-lakehouse/drafts" home="/platform" permission={"context.read"}>
      <View view="drafts" />
    </RouteView>
  )
}
