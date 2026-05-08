import type { MacroTopic } from '../types'
import { MACRO_TOPIC_LABELS } from '../store/computed'
import './TopicCard.css'

/** Emoji representing each macro topic (referenced in brainstorm ASCII) */
const TOPIC_EMOJI: Record<MacroTopic, string> = {
  senales:   '🚦',
  reglas:    '🛣️',
  seguridad: '⚠️',
  especial:  '🚗',
}

interface TopicCardProps {
  topic: MacroTopic
  masteryPct: number
  onTap: () => void
}

export function TopicCard({ topic, masteryPct, onTap }: TopicCardProps) {
  const label = MACRO_TOPIC_LABELS[topic]
  const emoji = TOPIC_EMOJI[topic]
  // Clamp to 0–100 for the progress bar width
  const pct = Math.max(0, Math.min(100, masteryPct))

  return (
    <button
      className="topic-card"
      onClick={onTap}
      type="button"
      aria-label={`${label}: ${pct}% dominado`}
    >
      <div className="topic-card__header">
        <span className="topic-card__emoji" aria-hidden="true">{emoji}</span>
        <span className="topic-card__label">{label}</span>
        <span className="topic-card__pct">{pct}%</span>
      </div>

      <div className="topic-card__bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Dominio: ${pct}%`}>
        <div
          className="topic-card__bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  )
}

export default TopicCard
