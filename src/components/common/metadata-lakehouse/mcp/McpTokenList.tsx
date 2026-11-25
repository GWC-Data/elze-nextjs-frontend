import { ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState, InlineLoading } from '@/components/common/States'
import { useMcpTokens, useRevokeMcpToken } from '@/hooks/useMcp'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import type { McpToken } from '@/types/mcp'

const DAY_MS = 24 * 60 * 60 * 1000

function statusText(token: McpToken, now: number): string {
  if (token.status === 'revoked') return 'Revoked'
  if (token.status === 'expired') return 'Expired'
  const days = Math.ceil((new Date(token.expiresAt).getTime() - now) / DAY_MS)
  return `Expires in ${days} ${days === 1 ? 'day' : 'days'}`
}

export function McpTokenList({ onBack }: { onBack: () => void }) {
  const tokens = useMcpTokens()
  const revoke = useRevokeMcpToken()

  const revokeOne = (token: McpToken) =>
    revoke.mutate(token.id, {
      onSuccess: () => notify.success('Token revoked', `${token.name} stops working at once.`),
      onError: (err) => notify.failure('revoke the token', err),
    })

  return (
    <div className="min-w-0 space-y-3">
      <Button type="button" variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-xs" onClick={onBack}>
        <ChevronLeft className="size-4" aria-hidden />
        Back
      </Button>

      {tokens.isPending ? (
        <InlineLoading label="Loading your tokens…" />
      ) : tokens.isError ? (
        <ErrorState error={tokens.error} compact onRetry={() => void tokens.refetch()} />
      ) : tokens.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">You have no tokens yet.</p>
      ) : (
        <ul className="min-w-0 divide-y rounded-lg border">
          {tokens.data.map((token) => {
            const active = token.status === 'active'
            const revoking = revoke.isPending && revoke.variables === token.id
            return (
              <li key={token.id} className="flex min-w-0 items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-medium', !active && 'text-muted-foreground')}>
                    {token.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{token.prefix}…</span> · {statusText(token, tokens.dataUpdatedAt)}
                  </p>
                </div>
                {active ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 text-xs text-destructive hover:text-destructive"
                    disabled={revoking}
                    onClick={() => revokeOne(token)}
                  >
                    {revoking ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : 'Revoke'}
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
