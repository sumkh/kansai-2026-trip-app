import 'server-only'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Marked } from 'marked'
import { cache } from 'react'

/**
 * Renders docs/KANSAI-2026-MASTER-PLAN.md in full.
 *
 * The document stays the single source of truth. Transcribing it into
 * components would guarantee drift — and the master plan is the thing that
 * gets edited between now and September, not the app.
 *
 * Read at request time from the repo. Next's output tracing does not know
 * about docs/, so next.config.ts includes it explicitly for this route.
 */

const PLAN_PATH = ['docs', 'KANSAI-2026-MASTER-PLAN.md']

export type PlanHeading = { id: string; text: string; level: 2 | 3 }
export type RenderedPlan = { html: string; headings: PlanHeading[]; updatedAt: string }

/** Stable, readable anchors: "## 8. Site Index — ..." becomes "8-site-index". */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[—–]/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

export const getMasterPlan = cache(async (): Promise<RenderedPlan> => {
  const path = join(process.cwd(), ...PLAN_PATH)
  const [markdown, stat] = await Promise.all([
    readFile(path, 'utf8'),
    import('node:fs/promises').then((fs) => fs.stat(path)),
  ])

  const headings: PlanHeading[] = []
  const marked = new Marked({ gfm: true, breaks: false })

  marked.use({
    renderer: {
      heading(token) {
        const { text, depth, tokens } = token
        const parsed = this.parser.parseInline(tokens)
        if (depth === 2 || depth === 3) {
          const id = slugify(text)
          headings.push({ id, text: stripInline(text), level: depth })
          return `<h${depth} id="${id}">${parsed}</h${depth}>`
        }
        return `<h${depth}>${parsed}</h${depth}>`
      },
      // Tables are wide and this is read on a phone. Each one scrolls inside
      // its own container so the page body never scrolls sideways.
      table(token) {
        const header = `<tr>${token.header
          .map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`)
          .join('')}</tr>`
        const body = token.rows
          .map(
            (row) =>
              `<tr>${row.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`
          )
          .join('')
        return `<div class="md-table"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`
      },
      link({ href, tokens }) {
        const text = this.parser.parseInline(tokens)
        const external = /^https?:\/\//.test(href)
        return external
          ? `<a href="${href}" target="_blank" rel="noreferrer">${text} ↗</a>`
          : `<a href="${href}">${text}</a>`
      },
    },
  })

  const html = await marked.parse(markdown)

  return {
    html,
    headings,
    updatedAt: stat.mtime.toISOString(),
  }
})

/** Heading text for the contents list, without markdown emphasis markers. */
function stripInline(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\*/g, '')
    .trim()
}
