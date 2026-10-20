/**
 * macroTopic.ts — the 4 study topics shown on Inicio/Temas, and how raw categories map to them.
 *
 * Port of the Android app's domain/MacroTopic.kt. Pure TypeScript (no React, no browser APIs).
 */
import type { Category } from './types'

/** The four study topics, in display order. */
export const MACRO_TOPICS = ['SENALES', 'REGLAS', 'SEGURIDAD', 'ESPECIAL'] as const

/** One of the four study topics. */
export type MacroTopic = (typeof MACRO_TOPICS)[number]

/** Which raw question categories belong to each topic. */
export const TOPIC_CATEGORIES: Record<MacroTopic, readonly Category[]> = {
  SENALES: ['traffic-signals', 'road-markings'],
  REGLAS: ['right-of-way', 'speed-limits'],
  SEGURIDAD: ['dui', 'general'],
  ESPECIAL: ['school-zones'],
}

/** Spanish display names (Spanish chrome rule). */
export const TOPIC_LABELS: Record<MacroTopic, string> = {
  SENALES: 'Señales de Tráfico',
  REGLAS: 'Reglas del Camino',
  SEGURIDAD: 'Seguridad y Leyes',
  ESPECIAL: 'Conducción Especial',
}

/**
 * Returns the study topic for a raw category. Unknown categories fall back to SEGURIDAD,
 * exactly like the Android app, so a new category never crashes the app.
 */
export function macroTopicOf(category: string): MacroTopic {
  for (const topic of MACRO_TOPICS) {
    if ((TOPIC_CATEGORIES[topic] as readonly string[]).includes(category)) return topic
  }
  return 'SEGURIDAD'
}

/** Type guard for values coming from the URL (e.g. `#/study/REGLAS`). */
export function isMacroTopic(value: string): value is MacroTopic {
  return (MACRO_TOPICS as readonly string[]).includes(value)
}
