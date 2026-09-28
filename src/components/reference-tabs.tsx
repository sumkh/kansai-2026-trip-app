import Link from 'next/link'

const TABS = [
  { href: '/sites', label: 'Sites' },
  { href: '/restaurants', label: 'Food' },
  { href: '/guide', label: 'Guide' },
]

export function ReferenceTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-800/70">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition ${
            active === t.href
              ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
