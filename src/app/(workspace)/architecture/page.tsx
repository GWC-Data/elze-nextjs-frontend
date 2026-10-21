'use client'

import View from '@/views/ArchitecturePage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/architecture" home="/workspace">
      <View />
    </RouteView>
  )
}
