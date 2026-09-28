'use client'

import { useState, useTransition, useRef } from 'react'
import { inviteUser, setUserRole, removeUser, setPassword } from './actions'
import { MIN_PASSWORD } from '@/lib/password'

const FIELD =
  'w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none dark:border-stone-700 dark:bg-stone-800'

export function InviteForm() {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null)
        setDone(null)
        const email = String(formData.get('email') ?? '')
        startTransition(async () => {
          const r = await inviteUser(formData)
          if (r.ok) {
            formRef.current?.reset()
            setDone(`${email} can now sign in. Send them the password yourself.`)
          } else {
            setError(r.error)
          }
        })
      }}
      className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <input
        name="email"
        type="email"
        required
        autoCapitalize="none"
        autoComplete="off"
        placeholder="their.email@gmail.com"
        className={FIELD}
      />
      <input name="display_name" placeholder="Name (optional)" autoComplete="off" className={FIELD} />
      <input
        name="password"
        type="text"
        required
        minLength={MIN_PASSWORD}
        autoComplete="off"
        placeholder={`Password to give them (min ${MIN_PASSWORD} characters)`}
        className={FIELD}
      />
      <div className="flex items-center gap-2">
        <select name="role" defaultValue="viewer" className={`${FIELD} flex-1`}>
          <option value="viewer">Viewer — read only</option>
          <option value="traveller">Traveller — can edit</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
        >
          {pending ? 'Creating…' : 'Create'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {done && <p className="text-xs text-emerald-600">{done}</p>}
    </form>
  )
}

export function UserRow({
  email,
  displayName,
  role,
  isAdmin,
  isSelf,
  hasAccount,
}: {
  email: string
  displayName: string | null
  role: 'traveller' | 'viewer'
  isAdmin: boolean
  isSelf: boolean
  hasAccount: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [mode, setMode] = useState<'idle' | 'confirmRemove' | 'password'>('idle')
  const [newPassword, setNewPassword] = useState('')
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    setError(null)
    setNote(null)
    startTransition(async () => {
      const r = await fn()
      if (r.ok) onOk?.()
      else setError(r.error ?? 'Something went wrong.')
    })
  }

  return (
    <li className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {displayName || email}
            {isAdmin && (
              <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                admin
              </span>
            )}
          </p>
          <p className="truncate text-xs text-stone-500">{email}</p>
          <p className={`mt-0.5 text-xs ${hasAccount ? 'text-stone-400' : 'text-amber-600'}`}>
            {hasAccount ? 'account ready' : 'no account yet — set a password'}
          </p>
        </div>

        <select
          value={role}
          disabled={pending || isSelf}
          onChange={(e) =>
            run(() => setUserRole(email, e.target.value as 'traveller' | 'viewer'))
          }
          className="shrink-0 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800"
        >
          <option value="viewer">Viewer</option>
          <option value="traveller">Traveller</option>
        </select>
      </div>

      {mode === 'password' && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="off"
              autoFocus
              placeholder={`New password (min ${MIN_PASSWORD})`}
              className={FIELD}
            />
            {/* Only disabled while the request is in flight. A button disabled
                for a validation reason it does not state is indistinguishable
                from a broken one — let the click happen and say what is wrong. */}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => setPassword(email, newPassword),
                  () => {
                    setNewPassword('')
                    setMode('idle')
                    setNote('Password set. Send it to them yourself.')
                  }
                )
              }
              className="shrink-0 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-stone-50 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < MIN_PASSWORD && (
            <p className="mt-1 text-xs text-amber-600">
              {MIN_PASSWORD - newPassword.length} more character
              {MIN_PASSWORD - newPassword.length === 1 ? '' : 's'} needed
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs">
        {mode === 'confirmRemove' ? (
          <>
            <span className="text-stone-500">Remove {email} completely?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => removeUser(email), () => setMode('idle'))}
              className="font-medium text-red-600 underline underline-offset-4"
            >
              Yes, remove
            </button>
            <button type="button" onClick={() => setMode('idle')} className="text-stone-500">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMode(mode === 'password' ? 'idle' : 'password')}
              className="text-stone-500 underline underline-offset-4"
            >
              {hasAccount ? 'Set new password' : 'Create account'}
            </button>
            {!isSelf && (
              <button
                type="button"
                onClick={() => setMode('confirmRemove')}
                className="text-stone-400 underline underline-offset-4 hover:text-red-600"
              >
                Remove access
              </button>
            )}
          </>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {note && <p className="mt-1 text-xs text-emerald-600">{note}</p>}
    </li>
  )
}
