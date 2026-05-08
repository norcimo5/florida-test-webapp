import type { DailyReadiness, MockExamRecord } from '../types'
import './PerformanceChart.css'

// ─── Chart constants ─────────────────────────────────────────────────────────

const VIEW_W = 300
const VIEW_H = 140

/** Margins inside the SVG for axes / labels */
const MARGIN = { top: 8, right: 40, bottom: 24, left: 16 }

const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right  // 244
const PLOT_H = VIEW_H - MARGIN.top - MARGIN.bottom  // 108

/** Spanish day initials: Monday–Sunday (ISO weekday 1–7 → index 0–6) */
const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return the last 7 calendar day strings (YYYY-MM-DD), oldest first. */
function last7Days(): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    result.push(d.toISOString().slice(0, 10))
  }
  return result
}

/** Map a pct value (0–100) to an SVG y-coordinate within the plot area. */
function pctToY(pct: number): number {
  return MARGIN.top + PLOT_H - (pct / 100) * PLOT_H
}

/** Map a column index (0–6) to an SVG x-coordinate within the plot area. */
function colToX(col: number): number {
  return MARGIN.left + (col / 6) * PLOT_W
}

/** Get the ISO weekday initial (0 = Monday) for a YYYY-MM-DD string. */
function dayInitial(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  // getDay(): 0=Sun, 1=Mon … 6=Sat → remap to Mon=0 … Sun=6
  const iso = (d.getDay() + 6) % 7
  return DAY_INITIALS[iso]
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PerformanceChartProps {
  readiness: DailyReadiness[]
  mockScores: MockExamRecord[]
}

export function PerformanceChart({ readiness, mockScores }: PerformanceChartProps) {
  // ── Empty state ──────────────────────────────────────────────────────────
  if (readiness.length === 0) {
    return (
      <div className="perf-chart perf-chart--empty">
        <p className="perf-chart__empty-text">
          Empieza tu primer estudio para ver tu progreso.
        </p>
      </div>
    )
  }

  // ── Build a lookup: date → readinessPct ──────────────────────────────────
  const readinessMap = new Map<string, number>()
  for (const entry of readiness) {
    readinessMap.set(entry.date, entry.readinessPct)
  }

  const days = last7Days()

  // ── Readiness line points (only for days that have data) ─────────────────
  type Point = { x: number; y: number }
  const linePoints: Point[] = []
  for (let i = 0; i < days.length; i++) {
    const pct = readinessMap.get(days[i])
    if (pct !== undefined) {
      linePoints.push({ x: colToX(i), y: pctToY(pct) })
    }
  }

  // Build SVG path string
  let linePath = ''
  if (linePoints.length === 1) {
    // Single point — draw a dot only (no path)
    linePath = ''
  } else if (linePoints.length >= 2) {
    linePath = linePoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ')
  }

  // ── Mock score dots (within the 7-day window) ────────────────────────────
  const mockDots: { x: number; y: number; pct: number }[] = []
  for (const record of mockScores) {
    const dateStr = record.takenAt.slice(0, 10) // normalise to YYYY-MM-DD
    const colIdx = days.indexOf(dateStr)
    if (colIdx === -1) continue
    const pct = Math.round((record.scoreCorrect / record.scoreTotal) * 100)
    mockDots.push({ x: colToX(colIdx), y: pctToY(pct), pct })
  }

  // ── 80% goal line y ──────────────────────────────────────────────────────
  const goalY = pctToY(80)

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="perf-chart">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="perf-chart__svg"
        aria-label="Gráfico de progreso de los últimos 7 días"
        role="img"
      >
        {/* ── Grid / plot area background ─────────────────────────────── */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
        />

        {/* ── 80% goal line (dashed) ──────────────────────────────────── */}
        <line
          x1={MARGIN.left}
          y1={goalY}
          x2={MARGIN.left + PLOT_W}
          y2={goalY}
          stroke="var(--color-brand-amber)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          data-testid="goal-line"
          aria-label="Meta 80%"
        />

        {/* ── Goal label on the right ─────────────────────────────────── */}
        <text
          x={MARGIN.left + PLOT_W + 4}
          y={goalY + 4}
          fontSize="8"
          fill="var(--color-amber-text)"
          fontFamily="var(--font-sans)"
          fontWeight="600"
        >
          80%
        </text>

        {/* ── Readiness line ──────────────────────────────────────────── */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-brand-blue)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            data-testid="readiness-line"
          />
        )}

        {/* ── Single-point dot (when only one readiness entry) ─────────── */}
        {linePoints.length === 1 && (
          <circle
            cx={linePoints[0].x}
            cy={linePoints[0].y}
            r="3"
            fill="var(--color-brand-blue)"
            data-testid="readiness-line"
          />
        )}

        {/* ── Readiness data dots ─────────────────────────────────────── */}
        {linePoints.map((p, i) => (
          <circle
            key={`rd-${i}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--color-brand-blue)"
          />
        ))}

        {/* ── Mock exam score dots (teal, slightly larger) ────────────── */}
        {mockDots.map((d, i) => (
          <circle
            key={`md-${i}`}
            cx={d.x}
            cy={d.y}
            r="5"
            fill="var(--color-brand-teal)"
            stroke="#ffffff"
            strokeWidth="1.5"
            data-testid="mock-dot"
            aria-label={`Examen: ${d.pct}%`}
          />
        ))}

        {/* ── Day initials along the bottom ───────────────────────────── */}
        {days.map((day, i) => (
          <text
            key={`day-${i}`}
            x={colToX(i)}
            y={VIEW_H - 4}
            textAnchor="middle"
            fontSize="8"
            fill="var(--color-gray-500)"
            fontFamily="var(--font-sans)"
          >
            {dayInitial(day)}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default PerformanceChart
