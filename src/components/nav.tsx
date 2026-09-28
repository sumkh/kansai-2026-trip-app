import Link from 'next/link'
import { SignOutButton } from '@/components/sign-out-button'
import type { Profile } from '@/lib/auth'

/** Bottom nav, because this is used one-handed while walking. */
export function Nav({ attentionCount }: { attentionCount: number }) {
  const links = [
    { href: '/', label: 'Today', icon: '◔' },
    { href: '/itinerary', label: 'Days', icon: '≡' },
    // Sites, restaurants and the master plan share a tab bar from here.
    { href: '/sites', label: 'Places', icon: '⛩' },
    { href: '/checklist', label: 'To do', icon: '✓' },
    { href: '/attention', label: 'Flags', icon: '!', badge: attentionCount },
  ]

  return (
    <nav className="sticky bottom-0 z-10 border-t border-stone-200 bg-stone-50/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[11px] text-stone-500 transition hover:text-stone-900 dark:hover:text-stone-100"
          >
            <span className="text-lg leading-none" aria-hidden>
              {l.icon}
            </span>
            {l.label}
            {!!l.badge && (
              <span className="absolute right-[22%] top-1.5 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
                {l.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function Header({ profile }: { profile: Profile }) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-5 text-xs text-stone-500">
      <Link href="/account" className="hover:text-stone-800 dark:hover:text-stone-200">
        {profile.display_name ?? profile.email}
        <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-[10px] uppercase tracking-wide dark:bg-stone-800">
          {profile.role}
        </span>
      </Link>
      <span className="flex items-center gap-3">
        <Link href="/notes" className="underline underline-offset-4 hover:text-stone-800 dark:hover:text-stone-200">
          Notes
        </Link>
        {profile.is_admin && (
          <Link href="/admin" className="underline underline-offset-4 hover:text-stone-800 dark:hover:text-stone-200">
            Admin
          </Link>
        )}
        <SignOutButton />
      </span>
    </header>
  )
}
