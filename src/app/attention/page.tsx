import { requireProfile } from '@/lib/auth'
import { getAttention } from '@/lib/data'
import { countBySeverity } from '@/lib/attention'
import { AttentionList } from '@/components/attention-list'
import { Header, Nav } from '@/components/nav'

export default async function AttentionPage() {
  const profile = await requireProfile()
  const items = await getAttention()
  const counts = countBySeverity(items)

  const groups = [
    { key: 'critical' as const, heading: 'Needs action now', hint: 'Overdue, and something is at stake.' },
    { key: 'warning' as const, heading: 'Coming up', hint: 'Close enough to plan around.' },
    { key: 'info' as const, heading: 'Keep an eye on', hint: 'Not urgent yet.' },
  ]

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Flags</h1>
          <p className="mt-1 text-sm text-stone-500">
            {items.length === 0
              ? 'Nothing outstanding.'
              : `${counts.critical} urgent · ${counts.warning} soon · ${counts.info} watching`}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            Deadlines, unbooked legs, undecided routes and days you have not marked
            up. Judgement calls about whether the plan still makes sense come from a
            Claude Code review, not from here.
          </p>
        </section>

        {items.length === 0 ? (
          <AttentionList items={[]} emptyMessage="Nothing needs you right now." />
        ) : (
          groups.map(({ key, heading, hint }) => {
            const group = items.filter((i) => i.severity === key)
            if (group.length === 0) return null
            return (
              <section key={key}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  {heading}
                </h2>
                <p className="mb-3 text-xs text-stone-400">{hint}</p>
                <AttentionList items={group} />
              </section>
            )
          })
        )}
      </main>
      <Nav attentionCount={counts.critical} />
    </>
  )
}
