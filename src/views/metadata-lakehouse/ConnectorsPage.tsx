'use client'

import { useState } from 'react'
import { useNavigate } from '@/lib/router'
import { Lock } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { usePaths } from '@/hooks/usePaths'
import { endpoints } from '@/api/endpoints'
import { ContextQueryProvider } from '@/context/QueryProvider'
import { useConnectors } from '@/hooks/useMetadataLakehouse'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { QueryBoundary, TableSkeleton } from '@/components/common/metadata-lakehouse/DataStates'
import { ConnectorGallery } from '@/components/common/metadata-lakehouse/steps/ConnectorGallery'
import { ConnectionForm } from '@/components/common/metadata-lakehouse/steps/ConnectionForm'
import type { Connector } from '@/types/metadataLakehouse'

export default function ConnectorsPage() {
  return (
    <ContextQueryProvider>
      <ConnectorsView />
    </ContextQueryProvider>
  )
}

function ConnectorsView() {
  const { can } = useAuth()
  const paths = usePaths()
  const navigate = useNavigate()
  const canCreate = can('context.create')
  const connectors = useConnectors()
  const [chosen, setChosen] = useState<Connector | null>(null)

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Metadata Lakehouse' }, { label: 'Connectors' }]}
        title="Connectors"
        description="Connect a data source to start building a new context."
      />

      {canCreate ? null : (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Your role can see the connectors but not connect a new data source.
        </div>
      )}

      <Section className="mt-5">
        <QueryBoundary
          query={connectors}
          step="Connectors"
          endpoint={`GET ${endpoints.context.connectors()}`}
          context="load the connector catalogue"
          loading={<TableSkeleton rows={2} columns={3} />}
        >
          {(list) => (
            <ConnectorGallery
              connectors={list}
              selectedId={chosen?.id ?? null}
              onSelect={(connector) => {
                if (canCreate) setChosen(connector)
              }}
            />
          )}
        </QueryBoundary>
      </Section>

      {chosen ? (
        <ConnectionForm
          connector={chosen}
          onCancel={() => setChosen(null)}
          onConnected={(created) => {
            setChosen(null)
            navigate(paths.metadataLakehouseBuilder(created.connection.id, undefined, 'context'))
          }}
        />
      ) : null}
    </Page>
  )
}
