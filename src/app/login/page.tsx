import { Suspense } from 'react'
import { SignInForm } from './sign-in-form'
import { daysUntil, TRIP_START } from '@/lib/tokyo'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const away = daysUntil(TRIP_START)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Kansai</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          19–26 September 2026
        </h1>
        <p className="mt-3 text-stone-500">
          {away > 0 ? `${away} days away` : away === 0 ? 'Today.' : 'Osaka · Arima Onsen · Kyoto'}
        </p>
      </div>

      {error && (
        <p className="max-w-xs rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <Suspense>
        <SignInForm next={next} />
      </Suspense>

      <p className="max-w-xs text-xs leading-relaxed text-stone-500">
        Private trip app. Four accounts, invitation only — there is no sign-up.
        Forgotten your password? Ask Brian to set a new one — there is no reset email.
      </p>
    </main>
  )
}
