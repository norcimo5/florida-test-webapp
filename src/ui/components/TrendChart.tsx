/**
 * TrendChart.tsx — mock-exam score trend, port of the Android ui/common/TrendChart.kt.
 *
 * Teal line that "draws in" (CSS stroke animation), a dashed amber 80% pass-goal line, and a dot
 * per exam (green at/above 80%, red below) with a white ring. Pure SVG + CSS, no chart library.
 * The SVG stretches to the card width; dots are HTML overlays so they stay perfectly round.
 * `scores` are percentages, oldest first.
 */
import './components.css'

const W = 300
const H = 140

/** Props for TrendChart. */
export interface TrendChartProps {
  scores: number[]
}

/** Score trend line chart (the Perfil screen shows it once there are 2+ exams). */
export function TrendChart({ scores }: TrendChartProps) {
  const goalY = H * (1 - 0.8)
  const step = scores.length > 1 ? W / (scores.length - 1) : 0
  const points = scores.map((pct, i) => ({
    x: scores.length === 1 ? W / 2 : i * step,
    y: H * (1 - Math.min(100, Math.max(0, pct)) / 100),
    pct,
  }))
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const label = `Puntajes de exámenes, del más antiguo al más reciente: ${scores.map((s) => `${s}%`).join(', ')}`

  return (
    <div className="trend-chart" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <line
          x1={0}
          y1={goalY}
          x2={W}
          y2={goalY}
          stroke="var(--brand-amber)"
          strokeWidth={2}
          strokeDasharray="6 5"
          vectorEffect="non-scaling-stroke"
        />
        {points.length > 1 && (
          <path
            className="trend-chart__line"
            d={d}
            pathLength={1}
            fill="none"
            stroke="var(--brand-teal)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {points.map((p, i) => (
        <span
          key={i}
          className={`trend-chart__dot${p.pct >= 80 ? ' trend-chart__dot--pass' : ''}`}
          style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`, animationDelay: `${(i / points.length) * 0.9}s` }}
        />
      ))}
    </div>
  )
}
