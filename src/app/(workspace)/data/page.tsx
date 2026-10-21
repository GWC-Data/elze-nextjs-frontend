'use client'

import View from '@/views/DataPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/data" home="/workspace" permission={"data.read"}>
      <View />
    </RouteView>
  )
}
