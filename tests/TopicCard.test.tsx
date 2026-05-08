import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopicCard } from '../src/components/TopicCard'
import type { MacroTopic } from '../src/types'
import { MACRO_TOPIC_LABELS } from '../src/store/computed'

describe('TopicCard', () => {
  const allTopics: MacroTopic[] = ['senales', 'reglas', 'seguridad', 'especial']

  it('renders the Spanish topic label for each topic', () => {
    for (const topic of allTopics) {
      const { unmount } = render(
        <TopicCard topic={topic} masteryPct={42} onTap={() => {}} />,
      )
      expect(screen.getByText(MACRO_TOPIC_LABELS[topic])).toBeTruthy()
      unmount()
    }
  })

  it('renders the mastery percentage', () => {
    render(<TopicCard topic="senales" masteryPct={73} onTap={() => {}} />)
    expect(screen.getByText('73%')).toBeTruthy()
  })

  it('calls onTap when the card is clicked', async () => {
    const user = userEvent.setup()
    const onTap = vi.fn()
    render(<TopicCard topic="reglas" masteryPct={50} onTap={onTap} />)
    await user.click(screen.getByRole('button'))
    expect(onTap).toHaveBeenCalledOnce()
  })

  it('clamps masteryPct to 0 when given a negative value', () => {
    render(<TopicCard topic="seguridad" masteryPct={-10} onTap={() => {}} />)
    expect(screen.getByText('0%')).toBeTruthy()
    const fill = document.querySelector('.topic-card__bar-fill') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('clamps masteryPct to 100 when given a value > 100', () => {
    render(<TopicCard topic="especial" masteryPct={150} onTap={() => {}} />)
    expect(screen.getByText('100%')).toBeTruthy()
    const fill = document.querySelector('.topic-card__bar-fill') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  it('renders a progress bar with correct aria attributes', () => {
    render(<TopicCard topic="senales" masteryPct={60} onTap={() => {}} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('60')
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('progress bar fill reflects the mastery percentage', () => {
    render(<TopicCard topic="reglas" masteryPct={35} onTap={() => {}} />)
    const fill = document.querySelector('.topic-card__bar-fill') as HTMLElement
    expect(fill.style.width).toBe('35%')
  })

  it('renders as a button element', () => {
    render(<TopicCard topic="senales" masteryPct={20} onTap={() => {}} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })
})
