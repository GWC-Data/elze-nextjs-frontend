import View from '@/views/DataPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/data" home="/workspace" permission={"data.read"}>
      <View />
    </ServerRoute>
  )
}
