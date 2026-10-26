'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { Link, Navigate, useSearchParams } from '@/lib/router'
import { fetchResetTarget, resetPassword } from '@/api/auth.api'
import { errorMessage } from '@/api/client'
import { useAuth } from '@/context/authContext'
import AuthLayout from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { FormError, FormNotice, PasswordField } from '@/components/common/Fields'
import { notify } from '@/lib/notify'
import type { ResetTarget } from '@/types/auth'

const MIN_LENGTH = 8

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { status, user, adoptSession } = useAuth()

  const [target, setTarget] = useState<ResetTarget | null>(null)
  const [linkError, setLinkError] = useState<string | null>(
    token ? null : 'This link is missing its reset token.'
  )
  const [done, setDone] = useState(false)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const checking = Boolean(token) && target === null && linkError === null

  useEffect(() => {
    if (!token) return
    let cancelled = false

    fetchResetTarget(token)
      .then((found) => {
        if (!cancelled) setTarget(found)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLinkError(errorMessage(err, 'This password reset link is not valid.'))
      })

    return () => {
      cancelled = true
    }
  }, [token])

  if (done) return <Navigate to="/" replace />

  const replacingAnotherSession =
    status === 'AUTHENTICATED' && user !== null && target !== null && user.username !== target.username

  const tooShort = password.length > 0 && password.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && password !== confirm
  const ready = Boolean(password && confirm) && !tooShort && !mismatch

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending || !ready) return

    setError(null)
    setPending(true)
    try {
      await resetPassword(token, password)
      adoptSession()
      setDone(true)
      notify.success('Your password has been changed.', 'You are now signed in. Other sessions were signed out.')
    } catch (err) {
      setError(errorMessage(err, 'Could not change the password.'))
      setPending(false)
    }
  }

  if (checking) {
    return (
      <AuthLayout title="Resetting your password">
        <div
          className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Checking your link…
        </div>
      </AuthLayout>
    )
  }

  if (linkError || !target) {
    return (
      <AuthLayout title="This link is no longer valid">
        <div className="space-y-4">
          <FormError message={linkError || 'This password reset link is not valid.'} />
          <p className="text-sm text-muted-foreground">
            Reset links work once, expire after an hour, and a newer link replaces an older one.
          </p>
          <Button className="w-full" asChild>
            <Link to="/forgot-password">Ask for a new link</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={
        <>
          For <span className="font-medium text-foreground">{target.displayName || target.username}</span>
          {target.companyName && <> at {target.companyName}</>}
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {replacingAnotherSession && (
          <FormNotice
            message={`You are signed in as ${user?.username}. Finishing here replaces that session.`}
          />
        )}

        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          autoFocus
          disabled={pending}
          hint={`At least ${MIN_LENGTH} characters, including a digit or a symbol.`}
          error={tooShort ? `Use at least ${MIN_LENGTH} characters.` : null}
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={pending}
          error={mismatch ? 'The two passwords do not match.' : null}
        />

        {error && <FormError message={error} />}

        <Button type="submit" className="w-full" size="lg" disabled={pending || !ready}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Changing your password…
            </>
          ) : (
            <>
              <KeyRound aria-hidden />
              Change password and sign in
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
