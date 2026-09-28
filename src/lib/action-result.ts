/**
 * Shared result type for Server Actions, plus a wrapper that guarantees a
 * thrown error still reaches the user.
 *
 * This lives outside any 'use server' file on purpose: those may only export
 * async functions, so a plain helper cannot be defined there.
 */

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Runs an action and converts anything thrown into a returned error.
 *
 * Without this, a throw inside a Server Action rejects the promise, the client
 * `await` throws inside a transition, and the user sees a control that simply
 * does nothing — no message, no clue. A misconfigured environment variable is
 * exactly the case where that silence is most expensive.
 */
export async function safely(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn()
  } catch (e) {
    // Next implements redirect() and notFound() by THROWING. Swallowing those
    // would turn "your session expired, go to /login" into an error message on
    // a page you are no longer allowed to see. Let them through.
    if (isFrameworkControlFlow(e)) throw e

    const message = e instanceof Error ? e.message : String(e)
    console.error('[action]', message)
    return { ok: false, error: message }
  }
}

function isFrameworkControlFlow(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest
  return (
    typeof digest === 'string' &&
    (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND')
  )
}
