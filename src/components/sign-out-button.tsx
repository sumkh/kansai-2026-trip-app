'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearOfflineCaches } from '@/components/pwa'

export function SignOutButton({ className = '' }: { className?: string }) {
  const router = useRouter()

  async function signOut() {
    // Cached pages outlive the session otherwise, leaving the itinerary
    // readable on a signed-out device.
    await clearOfflineCaches()
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className={`text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-800 dark:hover:text-neutral-200 ${className}`}
    >
      Sign out
    </button>
  )
}
