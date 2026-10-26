import View from '@/views/metadata-lakehouse/ConnectionDatasetsPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="metadata-lakehouse/connections/:id" home="/platform" permission={"context.read"}>
      <View />
    </ServerRoute>
  )
}
