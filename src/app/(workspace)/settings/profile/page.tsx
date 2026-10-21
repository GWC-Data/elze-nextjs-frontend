'use client'

import View from '@/views/ProfilePage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/settings/profile" home="/workspace">
      <View />
    </RouteView>
  )
}
