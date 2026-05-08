import { useState, useRef, useEffect } from 'react'
import { GradientHeader } from './GradientHeader'
import { clearAll } from '../store/progressStore'
import './AjustesScreen.css'

interface AjustesProps {
  onResetComplete?: () => void
}

export function AjustesScreen({ onResetComplete }: AjustesProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  // Move focus into the modal when it opens
  useEffect(() => {
    if (modalOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus()
    }
  }, [modalOpen])

  // Close modal on Escape key
  useEffect(() => {
    if (!modalOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen])

  function handleReset() {
    clearAll()
    setModalOpen(false)
    onResetComplete?.()
  }

  return (
    <div className="ajustes">
      <GradientHeader variant="strip" title="Ajustes" />

      <div className="ajustes__body">
        {/* ── Row 1: Reiniciar progreso ─────────────────────────────────── */}
        <div className="ajustes__row">
          <span className="ajustes__row-label">Reiniciar progreso</span>
          <button
            className="ajustes__danger-btn"
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Reiniciar progreso"
          >
            Reiniciar
          </button>
        </div>

        <div className="ajustes__divider" role="separator" />

        {/* ── Row 2: Versión ────────────────────────────────────────────── */}
        <div className="ajustes__row">
          <span className="ajustes__row-label">Versión</span>
          <span className="ajustes__row-value">1.0.0</span>
        </div>

        <div className="ajustes__divider" role="separator" />

        {/* ── Row 3: Soporte ────────────────────────────────────────────── */}
        <div className="ajustes__row">
          <span className="ajustes__row-label">Soporte</span>
          <a
            className="ajustes__support-link"
            href="mailto:mperez.tech@gmail.com?subject=FL%20DMV%20Prep%20-%20Soporte"
            aria-label="Enviar correo de soporte"
          >
            mperez.tech@gmail.com
          </a>
        </div>
      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────── */}
      {modalOpen && (
        <div className="ajustes__modal-backdrop" aria-hidden="false">
          <div
            className="ajustes__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ajustes-modal-title"
          >
            <h2 id="ajustes-modal-title" className="ajustes__modal-title">
              ¿Estás seguro?
            </h2>
            <p className="ajustes__modal-message">
              Esta acción no se puede deshacer.
            </p>
            <div className="ajustes__modal-actions">
              <button
                ref={cancelBtnRef}
                className="ajustes__modal-cancel"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="ajustes__modal-confirm"
                type="button"
                onClick={handleReset}
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AjustesScreen
