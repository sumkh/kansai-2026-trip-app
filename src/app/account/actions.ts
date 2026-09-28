'use server'

import { createClient as createSessionClient } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { requireProfile } from '@/lib/auth'
import { safely, type ActionResult } from '@/lib/action-result'
import { passwordProblem } from '@/lib/password'

/**
 * Changing your own password.
 *
 * Supabase's updateUser() does NOT ask for the current password — a session
 * cookie is enough. That is too weak here: these are shared phones, left on
 * tables in ryokan and izakaya, and an unlocked one should not be able to
 * lock its owner out. So the current password is verified first.
 *
 * The check runs on a throwaway client with no session persistence, so a wrong
 * guess cannot disturb the signed-in session.
 */
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  return safely(async () => {
    const profile = await requireProfile()

    const problem = passwordProblem(newPassword)
    if (problem) return { ok: false, error: problem }

    if (currentPassword === newPassword) {
      return { ok: false, error: 'That is already your password.' }
    }

    const verifier = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    })
    if (verifyError) {
      return { ok: false, error: 'Your current password is not right.' }
    }

    const supabase = await createSessionClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: error.message }

    return { ok: true }
  })
}
