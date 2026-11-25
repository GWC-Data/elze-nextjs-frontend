import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight, KeyRound, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorState, InlineLoading } from '@/components/common/States'
import { McpCopyButton } from '@/components/common/metadata-lakehouse/mcp/McpCopyButton'
import { McpTokenList } from '@/components/common/metadata-lakehouse/mcp/McpTokenList'
import { MCP_CLIENTS, withToken } from '@/components/common/metadata-lakehouse/mcp/mcpClients'
import type { McpClientId } from '@/components/common/metadata-lakehouse/mcp/mcpClients'
import { useCreateMcpToken, useMcpAccess, useMcpTokens } from '@/hooks/useMcp'
import { notify } from '@/lib/notify'
import type { McpTarget } from '@/types/metadataLakehouse'
import type { IssuedMcpToken, McpAccess } from '@/types/mcp'

const TOKEN_DAYS = 90

export function McpDetailsDialog({
  connection,
  onOpenChange,
}: {
  connection: McpTarget | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={connection !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {connection ? <McpBody connection={connection} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function McpBody({ connection }: { connection: McpTarget }) {
  const published = connection.published ?? null
  const contextName = published?.name ?? null
  const access = useMcpAccess(connection.id, contextName)
  const tokens = useMcpTokens()
  const [view, setView] = useState<'main' | 'tokens'>('main')
  const [issued, setIssued] = useState<IssuedMcpToken | null>(null)
  const activeTokens = (tokens.data ?? []).filter((t) => t.status === 'active').length

  return (
    <>
      <DialogHeader className="shrink-0 gap-1 border-b px-5 py-4 pr-12 text-left">
        <DialogTitle className="text-base">Connect to an AI assistant</DialogTitle>
        <DialogDescription className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
          <span className="min-w-0 break-words text-foreground">{contextName ?? connection.name}</span>
          {published ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Live {published.label}
            </span>
          ) : null}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-5">
        {!contextName ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Publish this context first to connect an AI assistant.
          </p>
        ) : access.isPending ? (
          <InlineLoading label="Loading…" />
        ) : access.isError ? (
          <ErrorState error={access.error} compact onRetry={() => void access.refetch()} />
        ) : view === 'tokens' ? (
          <McpTokenList onBack={() => setView('main')} />
        ) : (
          <MainView access={access.data} issued={issued} onIssued={setIssued} />
        )}
      </div>

      {contextName && view === 'main' && access.isSuccess ? (
        <div className="shrink-0 border-t px-5 py-3">
          <button
            type="button"
            onClick={() => setView('tokens')}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage my tokens ({activeTokens})
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  )
}

function MainView({
  access,
  issued,
  onIssued,
}: {
  access: McpAccess
  issued: IssuedMcpToken | null
  onIssued: (token: IssuedMcpToken) => void
}) {
  const create = useCreateMcpToken()
  const [clientId, setClientId] = useState<McpClientId>('claudeDesktop')
  const client = MCP_CLIENTS.find((c) => c.id === clientId) ?? MCP_CLIENTS[0]
  const url = access.urls.context
  const templates = access.clients.context
  const setup = templates ? withToken(client.snippet(templates), access.auth.tokenPlaceholder, issued?.token ?? null) : null

  const generate = () =>
    create.mutate(
      { name: client.label, expiresInDays: TOKEN_DAYS },
      {
        onSuccess: (token) => {
          onIssued(token)
          notify.success('Token created', 'Copy it now: it is shown only once.')
        },
        onError: (err) => notify.failure('create the token', err),
      }
    )

  return (
    <div className="min-w-0 space-y-5">
      <Row label="Server URL">
        {url ? (
          <div className="flex min-w-0 items-center gap-2">
            <Value>{url}</Value>
            <McpCopyButton text={url} label="Copy server URL" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Not set up yet. Ask your administrator to set the MCP server URL.</p>
        )}
      </Row>

      <Row label="Token">
        {issued ? (
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <Value truncate>{issued.token}</Value>
              <McpCopyButton text={issued.token} label="Copy token" />
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">Shown once. Copy it now.</p>
          </div>
        ) : (
          <Button type="button" size="sm" className="h-8 gap-1.5" disabled={create.isPending} onClick={generate}>
            {create.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="size-3.5" aria-hidden />
            )}
            Generate token
          </Button>
        )}
      </Row>

      {setup ? (
        <Row
          label="Setup for"
          action={
            <div className="flex items-center gap-2">
              <Select value={clientId} onValueChange={(value) => setClientId(value as McpClientId)}>
                <SelectTrigger size="sm" className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MCP_CLIENTS.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <McpCopyButton text={setup} label={`Copy ${client.label} setup`} />
            </div>
          }
        >
          <pre className="max-h-40 overflow-x-hidden overflow-y-auto rounded-lg bg-zinc-950 px-3 py-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-100 [overflow-wrap:anywhere]">
            {setup}
          </pre>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{client.hint}</p>
        </Row>
      ) : null}
    </div>
  )
}

function Row({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

function Value({ children, truncate = false }: { children: string; truncate?: boolean }) {
  return (
    <span
      className={
        truncate
          ? 'min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-2.5 py-1.5 font-mono text-xs'
          : 'min-w-0 flex-1 rounded-md border bg-muted/40 px-2.5 py-1.5 font-mono text-xs break-all'
      }
    >
      {children}
    </span>
  )
}
