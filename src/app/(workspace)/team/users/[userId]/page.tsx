'use client'

import View from '@/views/PersonPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/team/users/:userId" home="/workspace" permission={"user.read"}>
      <View scope="team" />
    </RouteView>
  )
}
