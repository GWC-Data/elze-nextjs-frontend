'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { Link } from '@/lib/router'
import { requestPasswordReset } from '@/api/auth.api'
import { errorMessage } from '@/api/client'
import AuthLayout from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { FormError, FormNotice, TextField } from '@/components/common/Fields'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return

    setError(null)
    setPending(true)
    try {
      const { message } = await requestPasswordReset(identifier.trim())
      setSent(message)
    } catch (err) {
      setError(errorMessage(err, 'Could not send a reset link.'))
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="space-y-4">
          <FormNotice message={sent} />
          <p className="text-sm text-muted-foreground">
            The link works once and expires after an hour. Asking again replaces the previous link.
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  const ready = identifier.trim().length > 0

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your username or email and we will email you a link to choose a new password."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Username or email"
          value={identifier}
          onChange={setIdentifier}
          autoComplete="username"
          autoFocus
          disabled={pending}
          required
        />

        {error && <FormError message={error} />}

        <Button type="submit" className="w-full" size="lg" disabled={pending || !ready}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <Mail aria-hidden />
              Email me a reset link
            </>
          )}
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/login">Back to sign in</Link>
        </Button>
      </form>
    </AuthLayout>
  )
}
