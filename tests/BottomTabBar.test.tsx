import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomTabBar } from '../src/components/BottomTabBar'
import type { Screen } from '../src/types'

describe('BottomTabBar', () => {
  const tabs: { label: string; screen: Screen }[] = [
    { label: 'Inicio',   screen: 'home' },
    { label: 'Temas',    screen: 'temas' },
    { label: 'Exámenes', screen: 'exam' },
    { label: 'Perfil',   screen: 'perfil' },
    { label: 'Ajustes',  screen: 'ajustes' },
  ]

  it('renders all 5 tabs', () => {
    render(<BottomTabBar active="home" onChange={() => {}} />)
    for (const { label } of tabs) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('active tab has aria-current="page"', () => {
    for (const { screen: activeScreen, label } of tabs) {
      const { unmount } = render(
        <BottomTabBar active={activeScreen} onChange={() => {}} />,
      )
      const activeBtn = screen.getByText(label).closest('button')
      expect(activeBtn).toBeTruthy()
      expect(activeBtn!.getAttribute('aria-current')).toBe('page')

      // All other tabs must NOT have aria-current
      const otherTabs = tabs.filter(t => t.screen !== activeScreen)
      for (const { label: otherLabel } of otherTabs) {
        const btn = screen.getByText(otherLabel).closest('button')
        expect(btn!.getAttribute('aria-current')).toBeNull()
      }
      unmount()
    }
  })

  it('calls onChange with the correct screen when a tab is tapped', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<BottomTabBar active="home" onChange={onChange} />)

    for (const { label, screen: targetScreen } of tabs) {
      onChange.mockClear()
      const btn = screen.getByText(label).closest('button')!
      await user.click(btn)
      expect(onChange).toHaveBeenCalledOnce()
      expect(onChange).toHaveBeenCalledWith(targetScreen)
    }
  })

  it('active tab button has the active CSS class', () => {
    render(<BottomTabBar active="temas" onChange={() => {}} />)
    const temasBtn = screen.getByText('Temas').closest('button')!
    expect(temasBtn.className).toContain('bottom-tab-bar__tab--active')
  })

  it('inactive tabs do NOT have the active CSS class', () => {
    render(<BottomTabBar active="home" onChange={() => {}} />)
    const inactiveTabs = ['Temas', 'Exámenes', 'Perfil', 'Ajustes']
    for (const label of inactiveTabs) {
      const btn = screen.getByText(label).closest('button')!
      expect(btn.className).not.toContain('bottom-tab-bar__tab--active')
    }
  })

  it('every tab button has a Spanish aria-label', () => {
    render(<BottomTabBar active="home" onChange={() => {}} />)
    const expectedLabels = [
      'Ir a Inicio',
      'Ir a Temas',
      'Ir a Exámenes',
      'Ir a Perfil',
      'Ir a Ajustes',
    ]
    for (const ariaLabel of expectedLabels) {
      const btn = screen.getByRole('button', { name: ariaLabel })
      expect(btn).toBeTruthy()
    }
  })

  it('renders inside a nav element with an accessible name', () => {
    render(<BottomTabBar active="home" onChange={() => {}} />)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(nav).toBeTruthy()
  })
})
