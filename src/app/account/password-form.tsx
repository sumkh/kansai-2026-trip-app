'use client'

import { useState, useTransition } from 'react'
import { changeMyPassword } from './actions'
import { MIN_PASSWORD } from '@/lib/password'

const FIELD =
  'w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base placeholder:text-stone-400 focus:border-stone-400 focus:outline-none dark:border-stone-700 dark:bg-stone-800'

export function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const mismatch = confirm.length > 0 && next !== confirm
  const tooShort = next.length > 0 && next.length < MIN_PASSWORD

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)

    if (next !== confirm) {
      setError('The two new passwords do not match.')
      return
    }

    startTransition(async () => {
      const r = await changeMyPassword(current, next)
      if (r.ok) {
        setCurrent('')
        setNext('')
        setConfirm('')
        setDone(true)
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
        autoComplete="current-password"
        placeholder="Current password"
        className={FIELD}
      />
      <input
        type={show ? 'text' : 'password'}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        autoComplete="new-password"
        placeholder={`New password (min ${MIN_PASSWORD})`}
        className={FIELD}
      />
      <input
        type={show ? 'text' : 'password'}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
        placeholder="New password again"
        className={FIELD}
      />

      <label className="flex items-center gap-2 text-xs text-stone-500">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show the new password
      </label>

      {tooShort && (
        <p className="text-xs text-amber-600">
          {MIN_PASSWORD - next.length} more character
          {MIN_PASSWORD - next.length === 1 ? '' : 's'} needed
        </p>
      )}
      {mismatch && <p className="text-xs text-amber-600">The two new passwords do not match.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {done && <p className="text-xs text-emerald-600">Password changed. Use it next time you sign in.</p>}

      {/* Disabled only while saving. Everything else is explained above rather
          than expressed as a dead button. */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-50 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
      >
        {pending ? 'Changing…' : 'Change password'}
      </button>
    </form>
  )
}
