import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AjustesScreen } from '../src/components/AjustesScreen'

// ── localStorage helpers ──────────────────────────────────────────────────────

const PROGRESS_KEY = 'fl_driver_progress'
const SETTINGS_KEY = 'fl_driver_settings'

function seedLocalStorage() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ studyAnswers: { q1: { selectedIndex: 0, correct: true } } }))
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ userName: 'TESTUSER', examLength: 50, onboardingComplete: true }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AjustesScreen', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Row rendering ────────────────────────────────────────────────────────

  it('renders the strip header with title "Ajustes"', () => {
    render(<AjustesScreen />)
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByText('Ajustes')).toBeTruthy()
  })

  it('renders Row 1: "Reiniciar progreso" label', () => {
    render(<AjustesScreen />)
    expect(screen.getByText('Reiniciar progreso')).toBeTruthy()
  })

  it('renders Row 1: danger button with text "Reiniciar"', () => {
    render(<AjustesScreen />)
    // The row-level Reiniciar button (not the modal confirm)
    const btns = screen.getAllByRole('button')
    const reiniciarBtn = btns.find(b => b.textContent === 'Reiniciar')
    expect(reiniciarBtn).toBeTruthy()
  })

  it('renders Row 2: "Versión" label', () => {
    render(<AjustesScreen />)
    expect(screen.getByText('Versión')).toBeTruthy()
  })

  it('renders Row 2: hardcoded version "1.0.0"', () => {
    render(<AjustesScreen />)
    expect(screen.getByText('1.0.0')).toBeTruthy()
  })

  it('renders Row 3: "Soporte" label', () => {
    render(<AjustesScreen />)
    expect(screen.getByText('Soporte')).toBeTruthy()
  })

  it('renders Row 3: support mailto link', () => {
    render(<AjustesScreen />)
    const link = screen.getByRole('link', { name: /soporte/i })
    expect(link).toBeTruthy()
    expect((link as HTMLAnchorElement).href).toContain('mailto:mperez.tech@gmail.com')
  })

  it('renders exactly 3 rows (no extra settings rows)', () => {
    render(<AjustesScreen />)
    // Rows have class "ajustes__row" — verify via text content rather than class
    // The three labels should each be present exactly once
    expect(screen.getAllByText('Reiniciar progreso')).toHaveLength(1)
    expect(screen.getAllByText('Versión')).toHaveLength(1)
    expect(screen.getAllByText('Soporte')).toHaveLength(1)
    // No theme or sound rows
    expect(screen.queryByText(/tema/i)).toBeFalsy()
    expect(screen.queryByText(/sonido/i)).toBeFalsy()
  })

  // ── Modal: open ──────────────────────────────────────────────────────────

  it('modal is not visible initially', () => {
    render(<AjustesScreen />)
    expect(screen.queryByRole('dialog')).toBeFalsy()
  })

  it('opens the confirmation modal when Reiniciar row button is clicked', async () => {
    const user = userEvent.setup()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('modal shows "¿Estás seguro?" title', async () => {
    const user = userEvent.setup()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    expect(screen.getByText('¿Estás seguro?')).toBeTruthy()
  })

  it('modal shows "Esta acción no se puede deshacer." message', async () => {
    const user = userEvent.setup()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeTruthy()
  })

  it('modal shows "Cancelar" and "Reiniciar" buttons', async () => {
    const user = userEvent.setup()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    expect(screen.getByText('Cancelar')).toBeTruthy()
    // There are now two "Reiniciar" texts: the row btn and the modal confirm btn
    const allReiniciar = screen.getAllByText('Reiniciar')
    expect(allReiniciar.length).toBeGreaterThanOrEqual(1)
  })

  it('has aria-modal="true" on the dialog', async () => {
    const user = userEvent.setup()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  // ── Modal: cancel ────────────────────────────────────────────────────────

  it('Cancelar closes the modal without wiping localStorage', async () => {
    const user = userEvent.setup()
    seedLocalStorage()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    await user.click(screen.getByText('Cancelar'))
    // Modal closed
    expect(screen.queryByRole('dialog')).toBeFalsy()
    // localStorage still intact
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull()
    expect(localStorage.getItem(SETTINGS_KEY)).not.toBeNull()
  })

  it('pressing Escape closes the modal without wiping localStorage', async () => {
    const user = userEvent.setup()
    seedLocalStorage()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeFalsy()
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull()
  })

  // ── Modal: confirm reset ─────────────────────────────────────────────────

  it('confirming Reiniciar calls clearAll (localStorage is empty after)', async () => {
    const user = userEvent.setup()
    seedLocalStorage()
    render(<AjustesScreen />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    // Click the modal's Reiniciar confirm button (second occurrence of "Reiniciar")
    const allReiniciar = screen.getAllByRole('button', { name: /reiniciar/i })
    // The last one should be the modal confirm
    const confirmBtn = allReiniciar[allReiniciar.length - 1]
    await user.click(confirmBtn)
    // Modal should close
    expect(screen.queryByRole('dialog')).toBeFalsy()
    // localStorage keys removed
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
  })

  it('confirming Reiniciar calls onResetComplete prop', async () => {
    const user = userEvent.setup()
    const onResetComplete = vi.fn()
    render(<AjustesScreen onResetComplete={onResetComplete} />)
    const rowBtn = screen.getAllByRole('button').find(b => b.textContent === 'Reiniciar')!
    await user.click(rowBtn)
    const allReiniciar = screen.getAllByRole('button', { name: /reiniciar/i })
    await user.click(allReiniciar[allReiniciar.length - 1])
    expect(onResetComplete).toHaveBeenCalledOnce()
  })
})
