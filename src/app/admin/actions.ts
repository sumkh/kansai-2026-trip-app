'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireProfile } from '@/lib/auth'
import { safely, type ActionResult } from '@/lib/action-result'
import { passwordProblem } from '@/lib/password'
import type { Database } from '@/lib/database.types'

type UserRole = Database['public']['Enums']['user_role']

/**
 * Access management.
 *
 * Two tables, and the distinction matters: `allowed_users` decides who MAY have
 * access, `profiles` is created by a trigger when an account first signs in and
 * is what RLS actually reads. Changing a role has to touch both, or someone who
 * has already signed in keeps their old permissions forever.
 *
 * Everything here checks `profile.is_admin` against the user's own RLS-backed
 * client BEFORE touching the service-role client. RLS policies on both tables
 * are the real enforcement; these checks produce decent error messages.
 *
 * Every action is wrapped in safely(): account management depends on a
 * server-side env var, and a missing one must say so rather than making the
 * button do nothing.
 */

const notAdmin = (): ActionResult => ({
  ok: false,
  error: 'Only an admin can manage who has access.',
})

async function adminProfile() {
  const profile = await requireProfile()
  return profile.is_admin ? profile : null
}

/**
 * Adds someone to the allow list AND creates their account in one step.
 *
 * Public sign-up is disabled, so an allow-list row on its own gets nobody in —
 * there would be no way for them to create an account.
 */
export async function inviteUser(formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const admin = await adminProfile()
    if (!admin) return notAdmin()

    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const role = String(formData.get('role') ?? 'viewer') as UserRole
    const displayName = String(formData.get('display_name') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'That does not look like an email address.' }
    }
    if (role !== 'traveller' && role !== 'viewer') {
      return { ok: false, error: 'Role must be traveller or viewer.' }
    }
    const pwProblem = passwordProblem(password)
    if (pwProblem) return { ok: false, error: pwProblem }

    // Build the admin client first: if the service key is missing, fail before
    // writing the allow-list row, so a retry after fixing it is clean.
    const service = createAdminClient()

    const supabase = await createClient()
    const { error: allowErr } = await supabase
      .from('allowed_users')
      .upsert({ email, role, display_name: displayName || null }, { onConflict: 'email' })
    if (allowErr) return { ok: false, error: allowErr.message }

    // The trigger reads allowed_users and creates the profile with the right role.
    const { error: createErr } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr) {
      return createErr.message.toLowerCase().includes('already been registered')
        ? { ok: false, error: 'That email already has an account. Use "Set new password".' }
        : { ok: false, error: createErr.message }
    }

    revalidatePath('/admin')
    return { ok: true }
  })
}

/** For someone on the allow list with no account yet, or a forgotten password. */
export async function setPassword(email: string, password: string): Promise<ActionResult> {
  return safely(async () => {
    const admin = await adminProfile()
    if (!admin) return notAdmin()

    const pwProblem = passwordProblem(password)
    if (pwProblem) return { ok: false, error: pwProblem }

    const service = createAdminClient()
    const { data: list, error: listErr } = await service.auth.admin.listUsers({ perPage: 200 })
    if (listErr) return { ok: false, error: listErr.message }

    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (existing) {
      const { error } = await service.auth.admin.updateUserById(existing.id, { password })
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) return { ok: false, error: error.message }
    }

    revalidatePath('/admin')
    return { ok: true }
  })
}

export async function setUserRole(email: string, role: UserRole): Promise<ActionResult> {
  return safely(async () => {
    const admin = await adminProfile()
    if (!admin) return notAdmin()

    const supabase = await createClient()

    const { error: allowErr } = await supabase
      .from('allowed_users')
      .update({ role })
      .eq('email', email)
    if (allowErr) return { ok: false, error: allowErr.message }

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ role })
      .ilike('email', email)
    if (profErr) return { ok: false, error: profErr.message }

    revalidatePath('/admin')
    return { ok: true }
  })
}

/** Removes the allow-list row, the profile AND the account. All three, or the
 *  person keeps working: the profile is what RLS reads, and the account is what
 *  lets them sign in at all. */
export async function removeUser(email: string): Promise<ActionResult> {
  return safely(async () => {
    const admin = await adminProfile()
    if (!admin) return notAdmin()

    if (email.toLowerCase() === admin.email.toLowerCase()) {
      return { ok: false, error: 'You cannot remove yourself.' }
    }

    const service = createAdminClient()
    const supabase = await createClient()

    const { error } = await supabase.from('allowed_users').delete().eq('email', email)
    if (error) return { ok: false, error: error.message }

    const { error: profErr } = await supabase.from('profiles').delete().ilike('email', email)
    if (profErr) return { ok: false, error: profErr.message }

    const { data: list } = await service.auth.admin.listUsers({ perPage: 200 })
    const account = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (account) {
      const { error: delErr } = await service.auth.admin.deleteUser(account.id)
      if (delErr) return { ok: false, error: delErr.message }
    }

    revalidatePath('/admin')
    return { ok: true }
  })
}
