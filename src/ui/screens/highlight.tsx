/**
 * highlight.tsx — bolds the English exam keywords inside a question (the app's core teaching
 * mechanic). Port of `highlight()` in ui/study/StudyScreen.kt: case-insensitive, first occurrence
 * of each keyword, overlapping matches skipped.
 */
import type { ReactNode } from 'react'

/** Returns the text with each keyword's first occurrence wrapped in <mark>. */
export function highlightKeywords(text: string, keywords: string[]): ReactNode[] {
  const lower = text.toLowerCase()
  const hits = keywords
    .map((k) => ({ start: lower.indexOf(k.toLowerCase()), len: k.length }))
    .filter((h) => h.start >= 0 && h.len > 0)
    .sort((a, b) => a.start - b.start)
  const out: ReactNode[] = []
  let cursor = 0
  hits.forEach((h, i) => {
    if (h.start < cursor) return
    out.push(text.slice(cursor, h.start))
    out.push(<mark key={i}>{text.slice(h.start, h.start + h.len)}</mark>)
    cursor = h.start + h.len
  })
  out.push(text.slice(cursor))
  return out
}
