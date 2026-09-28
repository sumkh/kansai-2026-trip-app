import { requireProfile, canWrite } from '@/lib/auth'
import { getChecklist, getAttention } from '@/lib/data'
import { ChecklistRow } from '@/components/checklist-row'
import { Header, Nav } from '@/components/nav'

const CATEGORY_ORDER = ['booking', 'dining', 'transport', 'admin', 'packing', 'verify']

export default async function ChecklistPage() {
  const profile = await requireProfile()
  const [items, attention] = await Promise.all([getChecklist(), getAttention()])
  const writable = canWrite(profile)

  const groups = new Map<string, typeof items>()
  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }

  const ordered = [...groups.entries()].sort(
    ([a], [b]) =>
      (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99)
  )

  const outstanding = items.filter((i) => !i.done_at).length

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Before we go</h1>
          <p className="mt-1 text-sm text-stone-500">
            {outstanding} of {items.length} still to do
          </p>
        </section>

        {ordered.map(([category, list]) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {category}
            </h2>
            <ul className="space-y-2">
              {list
                .sort((a, b) => {
                  if (!!a.done_at !== !!b.done_at) return a.done_at ? 1 : -1
                  return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
                })
                .map((item) => (
                  <ChecklistRow key={item.id} item={item} canWrite={writable} />
                ))}
            </ul>
          </section>
        ))}
      </main>
      <Nav
        attentionCount={attention.filter((a) => a.severity === 'critical').length}
      />
    </>
  )
}
