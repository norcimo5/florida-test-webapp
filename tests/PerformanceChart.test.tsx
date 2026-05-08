import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PerformanceChart } from '../src/components/PerformanceChart'
import type { DailyReadiness, MockExamRecord } from '../src/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a YYYY-MM-DD string for N days ago from today. */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function makeReadiness(n: number, pct = 75): DailyReadiness[] {
  return Array.from({ length: n }, (_, i) => ({
    date: daysAgo(n - 1 - i),
    readinessPct: pct,
  }))
}

function makeMockRecord(daysBack: number, correct: number): MockExamRecord {
  return {
    id: daysAgo(daysBack),
    scoreCorrect: correct,
    scoreTotal: 50,
    takenAt: daysAgo(daysBack),
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PerformanceChart', () => {
  describe('empty state', () => {
    it('shows the Spanish empty-state message when readiness is empty', () => {
      render(<PerformanceChart readiness={[]} mockScores={[]} />)
      expect(
        screen.getByText('Empieza tu primer estudio para ver tu progreso.'),
      ).toBeTruthy()
    })

    it('does NOT render an SVG when readiness is empty', () => {
      render(<PerformanceChart readiness={[]} mockScores={[]} />)
      expect(document.querySelector('svg')).toBeNull()
    })
  })

  describe('with readiness data', () => {
    it('renders an SVG when readiness has entries', () => {
      render(<PerformanceChart readiness={makeReadiness(3)} mockScores={[]} />)
      expect(document.querySelector('svg')).toBeTruthy()
    })

    it('renders the dashed 80% goal line', () => {
      render(<PerformanceChart readiness={makeReadiness(3)} mockScores={[]} />)
      const goalLine = document.querySelector('[data-testid="goal-line"]')
      expect(goalLine).toBeTruthy()
      expect(goalLine!.getAttribute('stroke-dasharray')).toBeTruthy()
    })

    it('renders the "80%" text label', () => {
      render(<PerformanceChart readiness={makeReadiness(3)} mockScores={[]} />)
      // The text element inside SVG
      const svg = document.querySelector('svg')!
      expect(svg.textContent).toContain('80%')
    })

    it('renders the readiness line path', () => {
      render(<PerformanceChart readiness={makeReadiness(3, 60)} mockScores={[]} />)
      const path = document.querySelector('[data-testid="readiness-line"]')
      expect(path).toBeTruthy()
    })

    it('does NOT show the empty-state message when data is present', () => {
      render(<PerformanceChart readiness={makeReadiness(5)} mockScores={[]} />)
      expect(
        screen.queryByText('Empieza tu primer estudio para ver tu progreso.'),
      ).toBeNull()
    })
  })

  describe('mock exam score dots', () => {
    it('renders a dot for each mock score within the 7-day window', () => {
      const mocks: MockExamRecord[] = [
        makeMockRecord(0, 40),
        makeMockRecord(2, 35),
      ]
      render(<PerformanceChart readiness={makeReadiness(5)} mockScores={mocks} />)
      const dots = document.querySelectorAll('[data-testid="mock-dot"]')
      expect(dots.length).toBe(2)
    })

    it('does NOT render dots for mock scores outside the 7-day window', () => {
      const mocks: MockExamRecord[] = [
        makeMockRecord(10, 40), // too old
        makeMockRecord(15, 45), // too old
      ]
      render(<PerformanceChart readiness={makeReadiness(3)} mockScores={mocks} />)
      const dots = document.querySelectorAll('[data-testid="mock-dot"]')
      expect(dots.length).toBe(0)
    })

    it('renders zero dots when mockScores array is empty', () => {
      render(<PerformanceChart readiness={makeReadiness(5)} mockScores={[]} />)
      const dots = document.querySelectorAll('[data-testid="mock-dot"]')
      expect(dots.length).toBe(0)
    })
  })

  describe('day initials', () => {
    it('renders exactly 7 day-label text nodes in the SVG', () => {
      render(<PerformanceChart readiness={makeReadiness(7)} mockScores={[]} />)
      const svg = document.querySelector('svg')!
      // Day initials are in text elements; count those with single-char content
      const texts = Array.from(svg.querySelectorAll('text'))
      const singleChars = texts.filter(t => /^[LMJVSD]$/.test(t.textContent?.trim() ?? ''))
      expect(singleChars.length).toBe(7)
    })

    it('uses Spanish day initials (L M M J V S D)', () => {
      render(<PerformanceChart readiness={makeReadiness(7)} mockScores={[]} />)
      const svg = document.querySelector('svg')!
      const text = svg.textContent ?? ''
      // Should NOT contain English day letters only (W, T, F, Su, Mo, Tu, etc.)
      // Should contain at least some of L M J V S D
      expect(text).toMatch(/[LMJVSD]/)
    })
  })

  describe('SVG structure', () => {
    it('has correct viewBox attribute', () => {
      render(<PerformanceChart readiness={makeReadiness(3)} mockScores={[]} />)
      const svg = document.querySelector('svg')!
      expect(svg.getAttribute('viewBox')).toBe('0 0 300 140')
    })

    it('has an accessible role and aria-label', () => {
      render(<PerformanceChart readiness={makeReadiness(3)} mockScores={[]} />)
      const svg = screen.getByRole('img', {
        name: 'Gráfico de progreso de los últimos 7 días',
      })
      expect(svg).toBeTruthy()
    })
  })
})
