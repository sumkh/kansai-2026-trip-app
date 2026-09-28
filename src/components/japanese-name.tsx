'use client'

import { useState } from 'react'

/**
 * The Japanese name, tappable to copy.
 *
 * This is the single most useful field in the whole index. Half these places
 * have no English website and a romanised name gets you nowhere — but 黒門市場
 * pasted into Google Maps, or held up on a screen in a taxi, works every time.
 *
 * Rendered a size larger than the surrounding text for that reason: it has to
 * be legible to someone else, at arm's length, at night.
 */
export function JapaneseName({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard is blocked without HTTPS or a user gesture on some browsers.
      // The text is on screen either way, which is the point.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Tap to copy"
      className="inline-flex items-center gap-1.5 text-base text-stone-700 transition active:scale-[0.98] dark:text-stone-300"
      lang="ja"
    >
      {text}
      <span className="text-[10px] uppercase tracking-wide text-stone-400">
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  )
}
