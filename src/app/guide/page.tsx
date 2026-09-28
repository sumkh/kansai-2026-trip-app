import { requireProfile } from '@/lib/auth'
import { getAttention } from '@/lib/data'
import { getMasterPlan } from '@/lib/master-plan'
import { Header, Nav } from '@/components/nav'
import { ReferenceTabs } from '@/components/reference-tabs'

/** The master plan in full. Everything the app models as structure — days,
 *  checklist, sites, restaurants — plus everything it does not: the packing
 *  brief, hotel detail, transport legs, the Den Den Town guide. */
export default async function GuidePage() {
  const profile = await requireProfile()
  const [plan, attention] = await Promise.all([getMasterPlan(), getAttention()])

  const sections = plan.headings.filter((h) => h.level === 2)

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Master plan</h1>
          <p className="mt-1 text-sm text-stone-500">
            The whole document. This is the source everything else is built from.
          </p>
        </section>

        <ReferenceTabs active="/guide" />

        <nav className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Contents
          </p>
          <ol className="space-y-1.5">
            {sections.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="text-sm text-stone-700 underline-offset-4 hover:underline dark:text-stone-300"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article
          className="md"
          // The markdown is a file in this repo, written by us and reviewed in
          // git — not user input. Nothing from the database reaches it.
          dangerouslySetInnerHTML={{ __html: plan.html }}
        />

        <p className="pt-2 text-center text-xs text-stone-500">
          Last edited{' '}
          {new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Tokyo',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(new Date(plan.updatedAt))}
        </p>
      </main>
      <Nav attentionCount={attention.filter((a) => a.severity === 'critical').length} />
    </>
  )
}
