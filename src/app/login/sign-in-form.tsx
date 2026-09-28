'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      // Supabase says "Invalid login credentials" for both a wrong password
      // and an address with no account. Do not guess which — saying "no such
      // account" would confirm to a stranger who is on the trip.
      setError(
        error.message === 'Invalid login credentials'
          ? 'That email and password do not match.'
          : error.message
      )
      setBusy(false)
      return
    }

    router.push(next ?? '/')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xs space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        autoCapitalize="none"
        placeholder="Email"
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        placeholder="Password"
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email || !password}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-stone-50 transition active:scale-[0.98] disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
