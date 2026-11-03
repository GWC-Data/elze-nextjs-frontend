import { contextHttp } from '@/api/client'
import { endpoints, versionParams } from '@/api/endpoints'
import type { BusinessLayer, BusinessLayerState } from '@/types/metadataLakehouse'

export function getBusinessLayer(connectionId: string, version?: string | null): Promise<BusinessLayerState> {
  return contextHttp.get<BusinessLayerState>(endpoints.context.businessLayer(connectionId), {
    params: versionParams(version),
  })
}

export function saveBusinessLayer(connectionId: string, body: BusinessLayer): Promise<BusinessLayerState> {
  return contextHttp.put<BusinessLayerState>(endpoints.context.businessLayer(connectionId), body)
}
