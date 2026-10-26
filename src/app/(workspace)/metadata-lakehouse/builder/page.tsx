import View from '@/views/metadata-lakehouse/MetadataLakehouseBuilderPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/metadata-lakehouse/builder" home="/workspace" permission={"context.read"} abilities={PAGE_ABILITIES.MetadataLakehouseBuilderPage}>
      <View />
    </ServerRoute>
  )
}
