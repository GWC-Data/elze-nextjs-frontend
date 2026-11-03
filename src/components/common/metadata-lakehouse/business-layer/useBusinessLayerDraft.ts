import { useCallback, useEffect, useRef, useState } from 'react'
import { useBusinessLayer, useSaveBusinessLayer } from '@/hooks/useMetadataLakehouse'
import { useViewVersionId } from '@/context/workflowContext'
import { EMPTY_LAYER } from '@/components/common/metadata-lakehouse/business-layer/businessLayerModel'
import type { BusinessLayer } from '@/types/metadataLakehouse'

const SAVE_DELAY_MS = 800

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function useBusinessLayerDraft(connectionId: string | null, readOnly: boolean) {
  const version = useViewVersionId()
  const query = useBusinessLayer(connectionId)
  const { mutateAsync } = useSaveBusinessLayer(connectionId)

  const [layer, setLayer] = useState<BusinessLayer>(EMPTY_LAYER)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<unknown>(null)
  const [edited, setEdited] = useState(false)

  const latest = useRef<BusinessLayer>(EMPTY_LAYER)
  const dirty = useRef(false)
  const inflight = useRef<Promise<boolean> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadKey = `${connectionId ?? ''}:${version ?? 'draft'}`
  if (query.isSuccess && loadedFor !== loadKey) {
    setLoadedFor(loadKey)
    setLayer(query.data.businessLayer)
  }

  useEffect(() => {
    latest.current = layer
  }, [layer])

  const persist = useCallback(async (): Promise<boolean> => {
    if (inflight.current) await inflight.current
    if (!dirty.current) return true
    dirty.current = false
    setSaveState('saving')
    const run = mutateAsync(latest.current).then(
      () => {
        setSaveState(dirty.current ? 'pending' : 'saved')
        setSaveError(null)
        return true
      },
      (err: unknown) => {
        dirty.current = true
        setSaveState('error')
        setSaveError(err)
        return false
      }
    )
    inflight.current = run
    const ok = await run
    inflight.current = null
    return ok
  }, [mutateAsync])

  const update = useCallback(
    (change: (current: BusinessLayer) => BusinessLayer) => {
      if (readOnly) return
      const next = change(latest.current)
      latest.current = next
      dirty.current = true
      setLayer(next)
      setEdited(true)
      setSaveState('pending')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void persist(), SAVE_DELAY_MS)
    },
    [readOnly, persist]
  )

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    return persist()
  }, [persist])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      if (dirty.current) void persist()
    },
    [persist]
  )

  const markAnalysed = useCallback(() => setEdited(false), [])

  const touch = useCallback(async (): Promise<boolean> => {
    if (readOnly) return false
    dirty.current = true
    return flush()
  }, [readOnly, flush])

  return {
    query,
    layer,
    ready: loadedFor === loadKey,
    update,
    flush,
    saveState,
    saveError,
    edited,
    markAnalysed,
    touch,
  }
}
