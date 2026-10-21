'use client'

import View from '@/views/workspace/AccessPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/team/access" home="/workspace" permission={"access.read"}>
      <View />
    </RouteView>
  )
}
