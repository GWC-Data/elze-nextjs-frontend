import View from '@/views/metadata-lakehouse/ConnectorsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="metadata-lakehouse/connectors" home="/platform" permission={"context.read"} abilities={PAGE_ABILITIES.MetadataLakehouseConnectorsPage}>
      <View />
    </ServerRoute>
  )
}
