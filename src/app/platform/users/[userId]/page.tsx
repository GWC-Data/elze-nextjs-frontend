'use client'

import View from '@/views/PersonPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="users/:userId" home="/platform" permission={"user.read"}>
      <View scope="platform" />
    </RouteView>
  )
}
